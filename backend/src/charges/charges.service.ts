import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomesService } from '../incomes/incomes.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { parseISODate, toISODate } from '../common/date.util';

@Injectable()
export class ChargesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly incomes: IncomesService,
  ) {}

  findAll(userId: string) {
    return this.prisma.forUser(userId, (tx) => tx.charge.findMany({ where: { userId }, orderBy: { dueDate: 'desc' } }));
  }

  create(userId: string, dto: CreateChargeDto) {
    return this.prisma.forUser(userId, (tx) =>
      tx.charge.create({
        data: {
          userId,
          clientName: dto.clientName,
          description: dto.description,
          amount: dto.amount,
          dueDate: parseISODate(dto.dueDate),
          notes: dto.notes,
          recurrence: dto.recurrence,
          status: 'pending',
        },
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateChargeDto) {
    if (dto.status === 'received') {
      throw new BadRequestException('Use POST /charges/:id/settle para marcar uma cobrança como recebida.');
    }

    const result = await this.prisma.forUser(userId, (tx) =>
      tx.charge.updateMany({
        where: { id, userId },
        data: {
          clientName: dto.clientName,
          description: dto.description,
          amount: dto.amount,
          dueDate: dto.dueDate ? parseISODate(dto.dueDate) : undefined,
          notes: dto.notes,
          recurrence: dto.recurrence,
          status: dto.status,
        },
      }),
    );
    if (result.count === 0) throw new NotFoundException('Cobrança não encontrada.');
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.forUser(userId, (tx) => tx.charge.deleteMany({ where: { id, userId } }));
    if (result.count === 0) throw new NotFoundException('Cobrança não encontrada.');
  }

  /** Atomically marks the charge as received and books the matching income — a pending charge is never counted as income (mirrors frontend/src/services/financeService.ts). */
  async settle(userId: string, id: string, receivedAt?: string) {
    const receivedDate = receivedAt ? parseISODate(receivedAt) : new Date();

    return this.prisma.forUser(userId, async (tx) => {
      const charge = await tx.charge.findFirst({ where: { id, userId } });
      if (!charge) throw new NotFoundException('Cobrança não encontrada.');
      if (charge.status !== 'pending') {
        throw new BadRequestException('Somente cobranças pendentes podem ser recebidas.');
      }

      const updated = await tx.charge.update({
        where: { id },
        data: { status: 'received', receivedAt: receivedDate },
      });

      const chargeCategory = await tx.category.findFirst({
        where: { userId, slug: 'cobrancas', kind: 'income' },
      });
      if (!chargeCategory) {
        throw new BadRequestException('Categoria de cobranças não encontrada. Recrie-a em Configurações.');
      }

      const income = await this.incomes.createFromCharge(tx, userId, {
        chargeId: charge.id,
        description: `${charge.clientName} — ${charge.description}`,
        amount: charge.amount,
        date: receivedDate,
        categoryId: chargeCategory.id,
      });

      return { charge: updated, income };
    });
  }

  private async findOne(userId: string, id: string) {
    const row = await this.prisma.forUser(userId, (tx) => tx.charge.findFirst({ where: { id, userId } }));
    if (!row) throw new NotFoundException('Cobrança não encontrada.');
    return row;
  }
}

export function toChargeResponse(row: {
  id: string;
  clientName: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
  receivedAt: Date | null;
  notes: string | null;
  recurrence: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    clientName: row.clientName,
    description: row.description,
    amount: row.amount,
    dueDate: toISODate(row.dueDate),
    status: row.status,
    receivedAt: row.receivedAt ? toISODate(row.receivedAt) : undefined,
    notes: row.notes ?? undefined,
    recurrence: row.recurrence,
    createdAt: row.createdAt.toISOString(),
  };
}
