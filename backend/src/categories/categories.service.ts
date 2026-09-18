import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { FALLBACK_SLUG, PROTECTED_CATEGORY_SLUGS } from '../common/constants/categories';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.forUser(userId, (tx) =>
      tx.category.findMany({ where: { userId }, orderBy: [{ kind: 'asc' }, { name: 'asc' }] }),
    );
  }

  create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.forUser(userId, (tx) =>
      tx.category.create({
        data: {
          userId,
          name: dto.name.trim(),
          kind: dto.kind,
          icon: dto.icon,
          color: dto.color.toLowerCase(),
        },
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const result = await this.prisma.forUser(userId, (tx) =>
      tx.category.updateMany({
        where: { id, userId },
        data: {
          name: dto.name?.trim(),
          icon: dto.icon,
          color: dto.color?.toLowerCase(),
        },
      }),
    );
    if (result.count === 0) throw new NotFoundException('Categoria não encontrada.');
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.prisma.forUser(userId, async (tx) => {
      const category = await tx.category.findFirst({ where: { id, userId } });
      if (!category) throw new NotFoundException('Categoria não encontrada.');
      if (category.slug && (PROTECTED_CATEGORY_SLUGS as readonly string[]).includes(category.slug)) {
        throw new BadRequestException('Esta categoria do sistema não pode ser excluída.');
      }

      const fallbackSlug = FALLBACK_SLUG[category.kind];
      if (category.slug === fallbackSlug) {
        throw new BadRequestException('A categoria padrão não pode ser excluída.');
      }

      const fallback = await tx.category.findFirst({
        where: { userId, slug: fallbackSlug, kind: category.kind },
      });
      if (!fallback) throw new BadRequestException('Categoria de destino não encontrada.');

      if (category.kind === 'expense') {
        await tx.expense.updateMany({ where: { userId, categoryId: id }, data: { categoryId: fallback.id } });
      } else {
        await tx.income.updateMany({ where: { userId, categoryId: id }, data: { categoryId: fallback.id } });
      }

      await tx.user.updateMany({
        where: { id: userId, defaultCategoryId: id },
        data: { defaultCategoryId: fallback.id },
      });

      await tx.category.delete({ where: { id } });
    });
  }

  private async findOne(userId: string, id: string) {
    const row = await this.prisma.forUser(userId, (tx) => tx.category.findFirst({ where: { id, userId } }));
    if (!row) throw new NotFoundException('Categoria não encontrada.');
    return row;
  }
}

export function toCategoryResponse(row: {
  id: string;
  slug: string | null;
  name: string;
  kind: string;
  icon: string;
  color: string;
}) {
  return {
    id: row.id,
    slug: row.slug ?? undefined,
    name: row.name,
    kind: row.kind,
    icon: row.icon,
    color: row.color,
  };
}

export async function requireCategory(
  tx: Prisma.TransactionClient,
  userId: string,
  categoryId: string,
  kind: 'expense' | 'income',
) {
  const category = await tx.category.findFirst({ where: { id: categoryId, userId, kind } });
  if (!category) throw new BadRequestException('Categoria inválida.');
  return category;
}
