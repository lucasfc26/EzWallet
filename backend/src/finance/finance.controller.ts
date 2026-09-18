import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { ExpensesService, toExpenseResponse } from '../expenses/expenses.service';
import { IncomesService, toIncomeResponse } from '../incomes/incomes.service';
import { ChargesService, toChargeResponse } from '../charges/charges.service';
import { CategoriesService, toCategoryResponse } from '../categories/categories.service';
import { CardsService, toCardResponse } from '../cards/cards.service';
import { PaymentOptionsService, toPaymentOptionResponse } from '../payment-options/payment-options.service';

/** Mirrors frontend/src/services/financeService.ts#fetchAll: one call, both collections. */
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly incomes: IncomesService,
    private readonly charges: ChargesService,
    private readonly categories: CategoriesService,
    private readonly cards: CardsService,
    private readonly paymentOptions: PaymentOptionsService,
  ) {}

  @Get('all')
  async all(@CurrentUser() user: AuthenticatedUser) {
    const [expenseRows, incomeRows, chargeRows, categoryRows, cardRows, paymentOptionRows] =
      await Promise.all([
        this.expenses.findAll(user.id),
        this.incomes.findAll(user.id),
        this.charges.findAll(user.id),
        this.categories.findAll(user.id),
        this.cards.findAll(user.id),
        this.paymentOptions.findAll(user.id),
      ]);

    const transactions = [...expenseRows.map(toExpenseResponse), ...incomeRows.map(toIncomeResponse)].sort(
      (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0),
    );

    return {
      transactions,
      charges: chargeRows.map(toChargeResponse),
      categories: categoryRows.map(toCategoryResponse),
      cards: cardRows.map(toCardResponse),
      paymentOptions: paymentOptionRows.map(toPaymentOptionResponse),
    };
  }
}
