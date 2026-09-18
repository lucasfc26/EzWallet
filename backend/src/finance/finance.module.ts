import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { ExpensesModule } from '../expenses/expenses.module';
import { IncomesModule } from '../incomes/incomes.module';
import { ChargesModule } from '../charges/charges.module';

@Module({
  imports: [ExpensesModule, IncomesModule, ChargesModule],
  controllers: [FinanceController],
})
export class FinanceModule {}
