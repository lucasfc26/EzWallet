import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '../common/constants/categories';
import { DEFAULT_PAYMENT_OPTIONS } from '../common/constants/payments';

const BCRYPT_ROUNDS = 12;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  monthlySpendCap: number | null;
  defaultCategoryId: string | null;
  defaultPaymentOptionId: string | null;
  defaultPaymentCardId: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // The `users` table has no RLS policy (see prisma/migrations/*_enable_rls) —
  // auth necessarily runs before any tenant context exists, so these go
  // through the plain client rather than PrismaService.forUser().

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  toPublicUser(user: {
    id: string;
    name: string;
    email: string;
    monthlySpendCap: number | null;
    defaultCategoryId: string | null;
    defaultPaymentOptionId: string | null;
    defaultPaymentCardId: string | null;
  }): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      monthlySpendCap: user.monthlySpendCap,
      defaultCategoryId: user.defaultCategoryId,
      defaultPaymentOptionId: user.defaultPaymentOptionId,
      defaultPaymentCardId: user.defaultPaymentCardId,
    };
  }

  async getPublicProfile(userId: string): Promise<PublicUser> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.toPublicUser(user);
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    const user = await this.prisma.user.create({ data });
    await this.seedDefaults(user.id);
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      monthlySpendCap?: number | null;
      defaultCategoryId?: string | null;
      defaultPaymentOptionId?: string | null;
      defaultPaymentCardId?: string | null;
    },
  ) {
    if (data.email) {
      const email = data.email.trim().toLowerCase();
      const taken = await this.prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (taken) throw new ConflictException('E-mail já cadastrado.');
      data = { ...data, email };
    }

    await this.validatePrefs(userId, data);

    const monthlySpendCap =
      data.monthlySpendCap === undefined
        ? undefined
        : data.monthlySpendCap && data.monthlySpendCap > 0
          ? data.monthlySpendCap
          : null;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        monthlySpendCap,
        defaultCategoryId: data.defaultCategoryId,
        defaultPaymentOptionId: data.defaultPaymentOptionId,
        defaultPaymentCardId: data.defaultPaymentCardId,
      },
    });
    return this.toPublicUser(updated);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.findById(userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Senha atual incorreta.');
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  seedDefaults(userId: string) {
    return this.prisma.forUser(userId, async (tx) => {
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({ userId, ...c })),
        skipDuplicates: true,
      });
      await tx.paymentOption.createMany({
        data: DEFAULT_PAYMENT_OPTIONS.map((p) => ({ userId, ...p })),
        skipDuplicates: true,
      });
    });
  }

  private async validatePrefs(
    userId: string,
    data: {
      defaultCategoryId?: string | null;
      defaultPaymentOptionId?: string | null;
      defaultPaymentCardId?: string | null;
    },
  ) {
    if (!data.defaultCategoryId && !data.defaultPaymentOptionId && !data.defaultPaymentCardId) {
      return;
    }

    await this.prisma.forUser(userId, async (tx) => {
      if (data.defaultCategoryId) {
        const category = await tx.category.findFirst({
          where: { id: data.defaultCategoryId, userId, kind: 'expense' },
        });
        if (!category) throw new BadRequestException('Categoria padrão inválida.');
      }
      if (data.defaultPaymentOptionId) {
        const option = await tx.paymentOption.findFirst({
          where: { id: data.defaultPaymentOptionId, userId },
        });
        if (!option) throw new BadRequestException('Forma de pagamento padrão inválida.');
      }
      if (data.defaultPaymentCardId) {
        const card = await tx.paymentCard.findFirst({
          where: { id: data.defaultPaymentCardId, userId },
        });
        if (!card) throw new BadRequestException('Cartão padrão inválido.');
      }
    });
  }
}
