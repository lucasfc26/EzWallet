import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentOptionDto, UpdatePaymentOptionDto } from './dto/payment-option.dto';

@Injectable()
export class PaymentOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.forUser(userId, (tx) =>
      tx.paymentOption.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    );
  }

  create(userId: string, dto: CreatePaymentOptionDto) {
    return this.prisma.forUser(userId, (tx) =>
      tx.paymentOption.create({
        data: { userId, name: dto.name.trim(), method: dto.method },
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdatePaymentOptionDto) {
    const result = await this.prisma.forUser(userId, (tx) =>
      tx.paymentOption.updateMany({
        where: { id, userId },
        data: {
          name: dto.name?.trim(),
          method: dto.method,
        },
      }),
    );
    if (result.count === 0) throw new NotFoundException('Forma de pagamento não encontrada.');
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.prisma.forUser(userId, async (tx) => {
      const option = await tx.paymentOption.findFirst({ where: { id, userId } });
      if (!option) throw new NotFoundException('Forma de pagamento não encontrada.');

      await tx.user.updateMany({
        where: { id: userId, defaultPaymentOptionId: id },
        data: { defaultPaymentOptionId: null },
      });

      await tx.paymentOption.delete({ where: { id } });
    });
  }

  private async findOne(userId: string, id: string) {
    const row = await this.prisma.forUser(userId, (tx) =>
      tx.paymentOption.findFirst({ where: { id, userId } }),
    );
    if (!row) throw new NotFoundException('Forma de pagamento não encontrada.');
    return row;
  }
}

export function toPaymentOptionResponse(row: {
  id: string;
  slug: string | null;
  name: string;
  method: string;
}) {
  return {
    id: row.id,
    slug: row.slug ?? undefined,
    name: row.name,
    method: row.method,
  };
}
