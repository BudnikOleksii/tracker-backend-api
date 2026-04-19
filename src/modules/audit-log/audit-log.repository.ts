import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, type SQL } from 'drizzle-orm';

import { auditLogs } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import type { DeviceContext } from '@/shared/types/device-context.js';

import type { SortByField } from './audit-log.constants.js';

export interface AuditLogData extends DeviceContext {
  action: string;
  actorId?: string;
  actorEmail?: string;
  resourceType?: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  requestId?: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  resourceType: string | null;
  resourceId: string | null;
  detail: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: Date;
}

export interface AuditLogListQuery {
  page: number;
  pageSize: number;
  actorId?: string;
  action?: string;
  sortBy?: SortByField;
  sortOrder?: SortOrder;
}

const SORT_COLUMN_MAP = {
  createdAt: auditLogs.createdAt,
} as const;

export interface AuditLogListResult {
  data: AuditLogRecord[];
  total: number;
}

@Injectable()
export class AuditLogRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async create(data: AuditLogData): Promise<void> {
    await this.db.insert(auditLogs).values({
      action: data.action,
      actorId: data.actorId ?? null,
      actorEmail: data.actorEmail ?? null,
      resourceType: data.resourceType ?? null,
      resourceId: data.resourceId ?? null,
      detail: data.detail ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      requestId: data.requestId ?? null,
    });
  }

  async findAll(query: AuditLogListQuery): Promise<AuditLogListResult> {
    const { page, pageSize, actorId, action, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const conditions: SQL[] = [];
    if (actorId) {
      conditions.push(eq(auditLogs.actorId, actorId));
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const sortDirection = sortOrder === 'asc' ? asc : desc;

    const [rows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(sortDirection(sortColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ count: count() }).from(auditLogs).where(whereClause),
    ]);

    const data: AuditLogRecord[] = rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      detail: row.detail,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      requestId: row.requestId,
      createdAt: row.createdAt,
    }));

    return {
      data,
      total: totalResult[0]?.count ?? 0,
    };
  }
}
