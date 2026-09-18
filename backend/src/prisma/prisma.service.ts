import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Every tenant-scoped query MUST go through `forUser`. It opens a
 * transaction, sets the Postgres session variable the RLS policies key off
 * (`app.current_user_id`, see prisma/migrations/*_enable_rls), and only then
 * runs the callback. `set_config(..., true)` scopes the value to the
 * transaction (like `SET LOCAL`), so it can never leak onto a pooled
 * connection reused by a different request.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  forUser<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
      return fn(tx);
    });
  }
}
