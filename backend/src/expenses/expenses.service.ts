import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { addRecurrence, expandRecurrenceCount, parseISODate, toISODate } from '../common/date.util';
import { requireCategory } from '../categories/categories.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.forUser(userId, (tx) =>
      tx.expense.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    );
  }

  async create(userId: string, dto: CreateExpenseDto) {
    const { stored, expand } = expandRecurrenceCount(dto.recurrence, dto.recurrenceCount);
    const groupId = expand > 1 ? randomUUID() : null;
    const start = parseISODate(dto.date);

    return this.prisma.forUser(userId, async (tx) => {
      await requireCategory(tx, userId, dto.categoryId, 'expense');
      const payment = await resolvePayment(
        tx,
        userId,
        dto.paymentMethod,
        dto.paymentCardId,
        dto.paymentOptionId,
      );

      const rows = [];
      for (let i = 0; i < expand; i += 1) {
        const date = i === 0 || dto.recurrence === 'none' ? start : addRecurrence(start, dto.recurrence, i);
        const status = i === 0 ? dto.status : 'pending';
        const dueDate = status === 'pending' ? date : null;
        rows.push(
          await tx.expense.create({
            data: {
              userId,
              description: dto.description,
              amount: dto.amount,
              date,
              categoryId: dto.categoryId,
              paymentMethod: payment.paymentMethod,
              paymentCardId: payment.paymentCardId,
              paymentOptionId: payment.paymentOptionId,
              status,
              notes: dto.notes,
              recurrence: dto.recurrence,
              recurrenceCount: stored,
              recurrenceGroupId: groupId,
              recurrenceIndex: i + 1,
              dueDate,
            },
          }),
        );
      }
      return rows;
    });
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    const derivedDueDate =
      dto.status && dto.date ? (dto.status === 'pending' ? dto.date : null) : undefined;

    const result = await this.prisma.forUser(userId, async (tx) => {
      if (dto.categoryId) await requireCategory(tx, userId, dto.categoryId, 'expense');
      const payment =
        dto.paymentMethod !== undefined ||
        dto.paymentCardId !== undefined ||
        dto.paymentOptionId !== undefined
          ? await resolvePayment(tx, userId, dto.paymentMethod, dto.paymentCardId, dto.paymentOptionId)
          : null;

      return tx.expense.updateMany({
        where: { id, userId },
        data: {
          description: dto.description,
          amount: dto.amount,
          date: dto.date ? parseISODate(dto.date) : undefined,
          categoryId: dto.categoryId,
          paymentMethod: payment?.paymentMethod,
          paymentCardId: payment ? payment.paymentCardId : undefined,
          paymentOptionId: payment ? payment.paymentOptionId : undefined,
          status: dto.status,
          notes: dto.notes,
          recurrence: dto.recurrence,
          recurrenceCount: dto.recurrenceCount,
          dueDate:
            derivedDueDate !== undefined
              ? derivedDueDate === null
                ? null
                : parseISODate(derivedDueDate)
              : dto.dueDate !== undefined
                ? parseISODate(dto.dueDate)
                : undefined,
        },
      });
    });
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

async function resolvePayment(
  tx: Prisma.TransactionClient,
  userId: string,
  paymentMethod: PaymentMethod | undefined,
  paymentCardId: string | undefined,
  paymentOptionId: string | undefined,
) {
  if (paymentCardId) {
    const card = await tx.paymentCard.findFirst({ where: { id: paymentCardId, userId } });
    if (!card) throw new BadRequestException('Cartão inválido.');
    return {
      paymentMethod: card.kind as PaymentMethod,
      paymentCardId: card.id,
      paymentOptionId: null as string | null,
    };
  }
  if (paymentOptionId) {
    const option = await tx.paymentOption.findFirst({ where: { id: paymentOptionId, userId } });
    if (!option) throw new BadRequestException('Forma de pagamento inválida.');
    return {
      paymentMethod: option.method,
      paymentCardId: null as string | null,
      paymentOptionId: option.id,
    };
  }
  return {
    paymentMethod: paymentMethod ?? PaymentMethod.pix,
    paymentCardId: null as string | null,
    paymentOptionId: null as string | null,
  };
}

export function toExpenseResponse(row: {
  id: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  paymentMethod: string;
  paymentCardId?: string | null;
  paymentOptionId?: string | null;
  status: string;
  dueDate: Date | null;
  notes: string | null;
  recurrence: string;
  recurrenceCount?: number;
  recurrenceGroupId?: string | null;
  recurrenceIndex?: number;
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
    paymentCardId: row.paymentCardId ?? undefined,
    paymentOptionId: row.paymentOptionId ?? undefined,
    status: row.status,
    dueDate: row.dueDate ? toISODate(row.dueDate) : undefined,
    notes: row.notes ?? undefined,
    recurrence: row.recurrence,
    recurrenceCount: row.recurrenceCount ?? 1,
    recurrenceGroupId: row.recurrenceGroupId ?? undefined,
    recurrenceIndex: row.recurrenceIndex ?? 1,
    createdAt: row.createdAt.toISOString(),
  };
}
