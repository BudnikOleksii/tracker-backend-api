import { applyDecorators } from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidatorConstraint,
} from 'class-validator';
import type {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
} from 'class-validator';

import { ErrorCode } from '../enums/error-code.enum.js';

export function IsEmailField(options?: ValidationOptions) {
  return applyDecorators(IsEmail({}, { ...options, context: { code: ErrorCode.INVALID_EMAIL } }));
}

export function IsStringField(options?: ValidationOptions) {
  return applyDecorators(IsString({ ...options, context: { code: ErrorCode.INVALID_FORMAT } }));
}

export function IsIntField(options?: ValidationOptions) {
  return applyDecorators(IsInt({ ...options, context: { code: ErrorCode.INVALID_FORMAT } }));
}

export function IsNotEmptyField(options?: ValidationOptions) {
  return applyDecorators(IsNotEmpty({ ...options, context: { code: ErrorCode.REQUIRED_FIELD } }));
}

export function IsUUIDField(version?: '3' | '4' | '5' | 'all', options?: ValidationOptions) {
  return applyDecorators(
    IsUUID(version, { ...options, context: { code: ErrorCode.INVALID_UUID } }),
  );
}

export function MinLengthField(min: number, options?: ValidationOptions) {
  return applyDecorators(
    MinLength(min, { ...options, context: { code: ErrorCode.INVALID_LENGTH } }),
  );
}

export function MaxLengthField(max: number, options?: ValidationOptions) {
  return applyDecorators(
    MaxLength(max, { ...options, context: { code: ErrorCode.INVALID_LENGTH } }),
  );
}

export function MinField(min: number, options?: ValidationOptions) {
  return applyDecorators(Min(min, { ...options, context: { code: ErrorCode.OUT_OF_RANGE } }));
}

export function MaxField(max: number, options?: ValidationOptions) {
  return applyDecorators(Max(max, { ...options, context: { code: ErrorCode.OUT_OF_RANGE } }));
}

export function MatchesField(pattern: RegExp, options?: ValidationOptions) {
  return applyDecorators(
    Matches(pattern, { ...options, context: { code: ErrorCode.INVALID_FORMAT } }),
  );
}

export function IsInField(values: readonly unknown[], options?: ValidationOptions) {
  return applyDecorators(IsIn(values, { ...options, context: { code: ErrorCode.INVALID_FORMAT } }));
}

export function IsBooleanField(options?: ValidationOptions) {
  return applyDecorators(IsBoolean({ ...options, context: { code: ErrorCode.INVALID_FORMAT } }));
}

export function IsISO8601Field(options?: ValidationOptions) {
  return applyDecorators(
    IsISO8601({ strict: true }, { ...options, context: { code: ErrorCode.INVALID_FORMAT } }),
  );
}

@ValidatorConstraint({ name: 'isNotBefore', async: false })
class IsNotBeforeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    if (!value || !relatedValue) {
      return true;
    }

    return new Date(value as string) >= new Date(relatedValue as string);
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];

    return `$property must not be before ${relatedPropertyName}`;
  }
}

export function IsNotBeforeField(property: string, options?: ValidationOptions) {
  return applyDecorators(
    Validate(IsNotBeforeConstraint, [property], {
      ...options,
      context: { code: ErrorCode.VALIDATION_ERROR },
    }),
  );
}
