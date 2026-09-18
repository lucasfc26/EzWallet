import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { ExpensesModule } from '../expenses/expenses.module';
import { IncomesModule } from '../incomes/incomes.module';
import { ChargesModule } from '../charges/charges.module';
import { CategoriesModule } from '../categories/categories.module';
import { CardsModule } from '../cards/cards.module';
import { PaymentOptionsModule } from '../payment-options/payment-options.module';

@Module({
  imports: [
    ExpensesModule,
    IncomesModule,
    ChargesModule,
    CategoriesModule,
    CardsModule,
    PaymentOptionsModule,
  ],
  controllers: [FinanceController],
})
export class FinanceModule {}
