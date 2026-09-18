import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { parseISODate, toISODate } from '../common/date.util';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.forUser(userId, (tx) =>
      tx.expense.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    );
  }

  async create(userId: string, dto: CreateExpenseDto) {
    const dueDate = dto.status === 'pending' ? dto.date : undefined;
    return this.prisma.forUser(userId, (tx) =>
      tx.expense.create({
        data: {
          userId,
          description: dto.description,
          amount: dto.amount,
          date: parseISODate(dto.date),
          categoryId: dto.categoryId,
          paymentMethod: dto.paymentMethod,
          status: dto.status,
          notes: dto.notes,
          recurrence: dto.recurrence,
          dueDate: dueDate ? parseISODate(dueDate) : null,
        },
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    // Full-form edits always send status + date together; the quick "mark as
    // paid/pending" toggle sends status alone. Only re-derive dueDate for the
    // former, mirroring create()'s rule — see ROADMAP.md "mock data parity".
    const derivedDueDate =
      dto.status && dto.date ? (dto.status === 'pending' ? dto.date : null) : undefined;

    const result = await this.prisma.forUser(userId, (tx) =>
      tx.expense.updateMany({
        where: { id, userId },
        data: {
          description: dto.description,
          amount: dto.amount,
          date: dto.date ? parseISODate(dto.date) : undefined,
          categoryId: dto.categoryId,
          paymentMethod: dto.paymentMethod,
          status: dto.status,
          notes: dto.notes,
          recurrence: dto.recurrence,
          dueDate:
            derivedDueDate !== undefined
              ? derivedDueDate === null
                ? null
                : parseISODate(derivedDueDate)
              : dto.dueDate !== undefined
                ? parseISODate(dto.dueDate)
                : undefined,
        },
      }),
    );
    if (result.count === 0) throw new NotFoundException('Despesa não encontrada.');
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.forUser(userId, (tx) => tx.expense.deleteMany({ where: { id, userId } }));
    if (result.count === 0) throw new NotFoundException('Despesa não encontrada.');
  }

  private async findOne(userId: string, id: string) {
    const row = await this.prisma.forUser(userId, (tx) => tx.expense.findFirst({ where: { id, userId } }));
    if (!row) throw new NotFoundException('Despesa não encontrada.');
    return row;
  }
}

export function toExpenseResponse(row: {
  id: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  paymentMethod: string;
  status: string;
  dueDate: Date | null;
  notes: string | null;
  recurrence: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    type: 'expense' as const,
    description: row.description,
    amount: row.amount,
    date: toISODate(row.date),
    categoryId: row.categoryId,
    paymentMethod: row.paymentMethod,
    status: row.status,
    dueDate: row.dueDate ? toISODate(row.dueDate) : undefined,
    notes: row.notes ?? undefined,
    recurrence: row.recurrence,
    createdAt: row.createdAt.toISOString(),
  };
}
