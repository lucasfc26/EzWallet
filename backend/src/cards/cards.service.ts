import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.forUser(userId, (tx) =>
      tx.paymentCard.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  create(userId: string, dto: CreateCardDto) {
    return this.prisma.forUser(userId, (tx) =>
      tx.paymentCard.create({
        data: { userId, brand: dto.brand, last4: dto.last4, kind: dto.kind },
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateCardDto) {
    const result = await this.prisma.forUser(userId, (tx) =>
      tx.paymentCard.updateMany({
        where: { id, userId },
        data: { brand: dto.brand, last4: dto.last4, kind: dto.kind },
      }),
    );
    if (result.count === 0) throw new NotFoundException('Cartão não encontrado.');
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.prisma.forUser(userId, async (tx) => {
      await tx.user.updateMany({
        where: { id: userId, defaultPaymentCardId: id },
        data: { defaultPaymentCardId: null },
      });
      const result = await tx.paymentCard.deleteMany({ where: { id, userId } });
      if (result.count === 0) throw new NotFoundException('Cartão não encontrado.');
    });
  }

  private async findOne(userId: string, id: string) {
    const row = await this.prisma.forUser(userId, (tx) => tx.paymentCard.findFirst({ where: { id, userId } }));
    if (!row) throw new NotFoundException('Cartão não encontrado.');
    return row;
  }
}

export function toCardResponse(row: { id: string; brand: string; last4: string; kind: string }) {
  return { id: row.id, brand: row.brand, last4: row.last4, kind: row.kind };
}
