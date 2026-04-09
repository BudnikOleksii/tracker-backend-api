import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { BCRYPT_ROUNDS } from '@/shared/constants/auth.constants.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

import { UserRepository } from '../user/user.repository.js';
import { TransactionCategoryRepository } from '../transaction-categories/transaction-categories.repository.js';
import type { CategoryInfo } from '../transaction-categories/transaction-categories.repository.js';
import { DefaultTransactionCategoryRepository } from '../default-transaction-categories/default-transaction-categories.repository.js';
import type { DefaultCategoryInfo } from '../default-transaction-categories/default-transaction-categories.repository.js';
import type { CompleteOnboardingDto } from './dtos/complete-onboarding.dto.js';

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  emailVerified: boolean;
  hasBaseCurrency: boolean;
  hasCategories: boolean;
  hasPassword: boolean;
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly categoryRepository: TransactionCategoryRepository,
    private readonly defaultCategoryRepository: DefaultTransactionCategoryRepository,
  ) {}

  async getStatus(userId: string): Promise<OnboardingStatus> {
    const user = await this.userRepository.findFullById(userId);
    const categoryCount = await this.categoryRepository.countByUserId(userId);

    return {
      onboardingCompleted: user.onboardingCompleted,
      emailVerified: user.emailVerified,
      hasBaseCurrency: user.baseCurrencyCode !== null,
      hasCategories: categoryCount > 0,
      hasPassword: user.passwordHash !== null,
    };
  }

  async complete(userId: string, dto: CompleteOnboardingDto): Promise<OnboardingStatus> {
    const user = await this.userRepository.findFullById(userId);

    if (user.onboardingCompleted) {
      throw new BadRequestException({
        code: ErrorCode.ONBOARDING_ALREADY_COMPLETED,
        message: 'Onboarding has already been completed',
      });
    }

    const categoryCount = await this.categoryRepository.countByUserId(userId);
    if (categoryCount === 0) {
      throw new BadRequestException({
        code: ErrorCode.ONBOARDING_CATEGORIES_REQUIRED,
        message: 'At least one transaction category is required to complete onboarding',
      });
    }

    if (dto.password && !user.passwordHash) {
      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      await this.userRepository.updatePasswordHash(userId, passwordHash);
    }

    await this.userRepository.updateProfile(userId, {
      baseCurrencyCode: dto.baseCurrencyCode as CurrencyCode,
      onboardingCompleted: true,
    });

    return this.getStatus(userId);
  }

  async assignDefaultCategories(userId: string): Promise<void> {
    const defaults: DefaultCategoryInfo[] = await this.defaultCategoryRepository.findAllActive();
    if (defaults.length === 0) {
      return;
    }

    const existing: CategoryInfo[] = await this.categoryRepository.findAllActiveByUserId(userId);

    const existingRootKeys = new Set(
      existing.filter((c) => c.parentCategoryId === null).map((c) => `${c.name}::${c.type}`),
    );

    const existingChildKeys = new Set(
      existing
        .filter((c) => c.parentCategoryId !== null)
        .map((c) => {
          const parent = existing.find((p) => p.id === c.parentCategoryId);

          return `${c.name}::${c.type}::${parent?.name ?? ''}`;
        }),
    );

    const defaultParents = defaults.filter((c) => c.parentDefaultTransactionCategoryId === null);
    const defaultChildren = defaults.filter((c) => c.parentDefaultTransactionCategoryId !== null);

    const missingParents = defaultParents.filter(
      (p) => !existingRootKeys.has(`${p.name}::${p.type}`),
    );

    await this.categoryRepository.transaction(async (tx) => {
      const parentIdMap = new Map<string, string>();

      for (const cat of existing.filter((c) => c.parentCategoryId === null)) {
        parentIdMap.set(`${cat.name}::${cat.type}`, cat.id);
      }

      if (missingParents.length > 0) {
        const inserted = await this.categoryRepository.bulkCreate(
          missingParents.map((p) => ({ userId, name: p.name, type: p.type })),
          tx,
        );

        for (const row of inserted) {
          parentIdMap.set(`${row.name}::${row.type}`, row.id);
        }
      }

      const missingChildValues = defaultChildren
        .filter((c) => {
          const parentDefault = defaultParents.find(
            (p) => p.id === c.parentDefaultTransactionCategoryId,
          );

          return (
            parentDefault !== undefined &&
            !existingChildKeys.has(`${c.name}::${c.type}::${parentDefault.name}`)
          );
        })
        .map((c) => {
          const parentDefault = defaults.find((p) => p.id === c.parentDefaultTransactionCategoryId);
          const parentCategoryId = parentDefault
            ? parentIdMap.get(`${parentDefault.name}::${parentDefault.type}`)
            : undefined;
          if (!parentCategoryId) {
            return null;
          }

          return { userId, name: c.name, type: c.type, parentCategoryId };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      await this.categoryRepository.bulkCreate(missingChildValues, tx);
    });
  }
}
