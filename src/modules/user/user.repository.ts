import { Inject, Injectable } from '@nestjs/common'
import { and, count, eq, gte, ilike, inArray } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { usersTable } from '../../database/schemas/users.js'
import { DB_TOKEN } from '../../database/types.js'

import type { DrizzleDb } from '../../database/types.js'
import type { User } from '../../database/schemas/users.js'

export interface UserInfo {
  id: string
  name: string
  email: string
  role: string
  banned: boolean
  banReason: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserListQuery {
  page: number
  pageSize: number
  search?: string
  role?: string
  banned?: boolean
}

export interface UserListResult {
  data: UserInfo[]
  total: number
}

export interface CreateUserData {
  name: string
  email: string
  passwordHash: string
  role?: string
}

export interface UpdateUserData {
  name?: string
  banned?: boolean
  banReason?: string | null
  role?: string | null
}

export interface UserSummary {
  total: number
  active: number
  adminCount: number
  newToday: number
}

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: UserListQuery): Promise<UserListResult> {
    const { page, pageSize, search, role, banned } = query

    const conditions: SQL[] = []
    if (banned !== undefined) {
      conditions.push(eq(usersTable.banned, banned))
    }
    if (role) {
      conditions.push(eq(usersTable.role, role as 'USER' | 'ADMIN'))
    }

    if (search) {
      const nameMatches = await this.db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(ilike(usersTable.name, `%${search}%`))

      const emailMatches = await this.db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(ilike(usersTable.email, `%${search}%`))

      const searchUserIds = [
        ...new Set([
          ...nameMatches.map((p) => p.id),
          ...emailMatches.map((i) => i.id),
        ]),
      ]

      if (searchUserIds.length === 0) {
        return { data: [], total: 0 }
      }
      conditions.push(inArray(usersTable.id, searchUserIds))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [usersData, totalResult] = await Promise.all([
      this.db
        .select()
        .from(usersTable)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(usersTable.createdAt),
      this.db.select({ count: count() }).from(usersTable).where(whereClause),
    ])

    const data: UserInfo[] = usersData.map((user) => this.toUserInfo(user))

    return {
      data,
      total: totalResult[0]?.count ?? 0,
    }
  }

  async findById(id: string): Promise<UserInfo | null> {
    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1)

    if (result.length === 0) return null
    return this.toUserInfo(result[0]!)
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
    return (result[0]?.count ?? 0) > 0
  }

  async create(data: CreateUserData): Promise<UserInfo> {
    const [user] = await this.db.insert(usersTable).values({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: (data.role as 'USER' | 'ADMIN') ?? 'USER',
    }).returning()
    return this.toUserInfo(user!)
  }

  async update(id: string, data: UpdateUserData): Promise<UserInfo | null> {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updates.name = data.name
    if (data.banned !== undefined) updates.banned = data.banned
    if (data.banReason !== undefined) updates.banReason = data.banReason
    if (data.role !== undefined) updates.role = data.role

    const result = await this.db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning()

    if (result.length === 0) return null
    return this.toUserInfo(result[0]!)
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
    return (result.rowCount ?? 0) > 0
  }

  async getSummary(): Promise<UserSummary> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalResult, activeResult, adminResult, newTodayResult] = await Promise.all([
      this.db.select({ count: count() }).from(usersTable),
      this.db.select({ count: count() }).from(usersTable).where(eq(usersTable.banned, false)),
      this.db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, 'ADMIN')),
      this.db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, today)),
    ])

    return {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      adminCount: adminResult[0]?.count ?? 0,
      newToday: newTodayResult[0]?.count ?? 0,
    }
  }

  private toUserInfo(user: User): UserInfo {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
