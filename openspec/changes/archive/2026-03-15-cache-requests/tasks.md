## 1. Cache Module Enhancements

- [x] 1.1 Add `delByPrefix(prefix: string): Promise<void>` to the `CachePort` interface
- [x] 1.2 Implement `delByPrefix` in `CacheService` using Redis `SCAN` + `DEL` (not `KEYS`)
- [x] 1.3 Add a cache key builder utility (helper function or constants for key patterns like `{module}:{userId}:{operation}:{paramsHash}`)

## 2. Transactions Caching

- [x] 2.1 Import `CacheService` into `TransactionsModule`
- [x] 2.2 Inject `CacheService` into `TransactionsService`
- [x] 2.3 Wrap `findAll` with cache-through logic using user-scoped keys including query param hash
- [x] 2.4 Wrap `findById` with cache-through logic using `transactions:{userId}:detail:{id}` key
- [x] 2.5 Add prefix-based cache invalidation (`transactions:{userId}:*`) to `create`, `update`, and `delete` methods

## 3. Transaction Categories Caching

- [x] 3.1 Import `CacheService` into `TransactionCategoriesModule`
- [x] 3.2 Inject `CacheService` into `TransactionCategoriesService`
- [x] 3.3 Wrap `findAll` with cache-through logic using user-scoped keys including query param hash
- [x] 3.4 Wrap `findById` with cache-through logic using `categories:{userId}:detail:{id}` key
- [x] 3.5 Add prefix-based cache invalidation (`categories:{userId}:*`) to `create`, `update`, and `delete` methods

## 4. Users Caching

- [x] 4.1 Import `CacheService` into `UserModule`
- [x] 4.2 Inject `CacheService` into `UserService`
- [x] 4.3 Wrap `findAll` with cache-through logic using `users:list:{paramsHash}` key
- [x] 4.4 Wrap `findById` with cache-through logic using `users:detail:{id}` key
- [x] 4.5 Wrap `getSummary` with cache-through logic using `users:summary` key
- [x] 4.6 Add prefix-based cache invalidation (`users:*`) to `create`, `update`, `assignRole`, and `delete` methods

## 5. Verification

- [x] 5.1 Run `pnpm check-types` — ensure no type errors
- [x] 5.2 Run `pnpm lint:fix` and `pnpm format` — ensure code style compliance
