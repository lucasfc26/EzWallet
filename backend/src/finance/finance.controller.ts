import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { ExpensesService, toExpenseResponse } from '../expenses/expenses.service';
import { IncomesService, toIncomeResponse } from '../incomes/incomes.service';
import { ChargesService, toChargeResponse } from '../charges/charges.service';

/** Mirrors frontend/src/services/financeService.ts#fetchAll: one call, both collections. */
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly incomes: IncomesService,
    private readonly charges: ChargesService,
  ) {}

  @Get('all')
  async all(@CurrentUser() user: AuthenticatedUser) {
    const [expenseRows, incomeRows, chargeRows] = await Promise.all([
      this.expenses.findAll(user.id),
      this.incomes.findAll(user.id),
      this.charges.findAll(user.id),
    ]);

    const transactions = [...expenseRows.map(toExpenseResponse), ...incomeRows.map(toIncomeResponse)].sort(
      (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0),
    );

    return { transactions, charges: chargeRows.map(toChargeResponse) };
  }
}
