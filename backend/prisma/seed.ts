/**
 * Ports frontend/src/data/seed.ts into real Postgres rows for a demo
 * account, so `docker compose up` starts from the same numbers the mock
 * localStorage version used to show — just persisted for real now.
 *
 * Run with: npm run prisma:seed (uses DATABASE_URL, the RLS-restricted
 * runtime role — set_config() opens the same per-request tenant context
 * PrismaService.forUser() uses, see src/prisma/prisma.service.ts).
 */
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_CATEGORIES } from '../src/common/constants/categories';
import { DEFAULT_PAYMENT_OPTIONS } from '../src/common/constants/payments';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@ezwallet.app';
const DEMO_PASSWORD = 'demo1234';

function forUser<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn(tx);
  });
}

function monthStart(monthsAgo = 0): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
}

function day(offset: number, base = monthStart()): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  return daysAgo(-n);
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Demo user ${DEMO_EMAIL} already exists (id=${existing.id}), skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.create({
    data: { name: 'Demo', email: DEMO_EMAIL, passwordHash },
  });

  const prev = monthStart(1);
  const prev2 = monthStart(2);

  await forUser(user.id, async (tx) => {
    const createdCats = await Promise.all(
      DEFAULT_CATEGORIES.map((c) => tx.category.create({ data: { userId: user.id, ...c } })),
    );
    const cat = Object.fromEntries(createdCats.map((c) => [c.slug, c.id])) as Record<string, string>;

    const createdPays = await Promise.all(
      DEFAULT_PAYMENT_OPTIONS.map((p) => tx.paymentOption.create({ data: { userId: user.id, ...p } })),
    );

    await tx.expense.createMany({
      data: [
        { userId: user.id, description: 'Aluguel', amount: 185000, date: day(4), categoryId: cat.moradia, paymentMethod: 'transfer', status: 'paid', recurrence: 'monthly' },
        { userId: user.id, description: 'Internet fibra', amount: 10990, date: day(5), categoryId: cat.moradia, paymentMethod: 'boleto', status: 'paid', recurrence: 'monthly' },
        { userId: user.id, description: 'Energia elétrica', amount: 18740, date: day(7), categoryId: cat.moradia, paymentMethod: 'boleto', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Mercado do mês', amount: 62350, date: day(6), categoryId: cat.alimentacao, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Combustível', amount: 22000, date: day(8), categoryId: cat.transporte, paymentMethod: 'debit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Academia', amount: 12990, date: day(9), categoryId: cat.saude, paymentMethod: 'credit', status: 'paid', recurrence: 'monthly' },
        { userId: user.id, description: 'Netflix', amount: 5590, date: day(10), categoryId: cat.assinaturas, paymentMethod: 'credit', status: 'paid', recurrence: 'monthly' },
        { userId: user.id, description: 'Spotify', amount: 2190, date: day(10), categoryId: cat.assinaturas, paymentMethod: 'credit', status: 'paid', recurrence: 'monthly' },
        { userId: user.id, description: 'Restaurante japonês', amount: 14800, date: day(12), categoryId: cat.alimentacao, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Uber — reunião', amount: 3450, date: day(13), categoryId: cat.transporte, paymentMethod: 'pix', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Curso de inglês', amount: 29900, date: day(14), categoryId: cat.educacao, paymentMethod: 'boleto', status: 'paid', recurrence: 'monthly' },
        { userId: user.id, description: 'Cinema com a família', amount: 9600, date: day(15), categoryId: cat.lazer, paymentMethod: 'debit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Farmácia', amount: 8730, date: daysAgo(3), categoryId: cat.saude, paymentMethod: 'pix', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Padaria', amount: 4250, date: daysAgo(2), categoryId: cat.alimentacao, paymentMethod: 'cash', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Mercado', amount: 12000, date: daysAgo(1), categoryId: cat.alimentacao, paymentMethod: 'debit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Combustível', amount: 8000, date: daysAgo(1), categoryId: cat.transporte, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Almoço no restaurante', amount: 4500, date: daysAgo(0), categoryId: cat.alimentacao, paymentMethod: 'pix', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Livro técnico', amount: 8990, date: daysAgo(0), categoryId: cat.educacao, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },

        { userId: user.id, description: 'Fatura do cartão', amount: 143200, date: day(24), categoryId: cat.compras, paymentMethod: 'credit', status: 'pending', dueDate: day(24), recurrence: 'none' },
        { userId: user.id, description: 'Condomínio', amount: 48000, date: day(19), categoryId: cat.moradia, paymentMethod: 'boleto', status: 'pending', dueDate: day(19), recurrence: 'monthly' },
        { userId: user.id, description: 'Plano de saúde', amount: 39800, date: day(21), categoryId: cat.saude, paymentMethod: 'boleto', status: 'pending', dueDate: day(21), recurrence: 'monthly' },
        { userId: user.id, description: 'Consulta médica', amount: 25000, date: day(26), categoryId: cat.saude, paymentMethod: 'pix', status: 'pending', dueDate: day(26), recurrence: 'none' },

        { userId: user.id, description: 'Aluguel', amount: 185000, date: day(4, prev), categoryId: cat.moradia, paymentMethod: 'transfer', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Mercado do mês', amount: 58900, date: day(6, prev), categoryId: cat.alimentacao, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Internet fibra', amount: 10990, date: day(5, prev), categoryId: cat.moradia, paymentMethod: 'boleto', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Combustível', amount: 31000, date: day(9, prev), categoryId: cat.transporte, paymentMethod: 'debit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Viagem de fim de semana', amount: 96000, date: day(21, prev), categoryId: cat.lazer, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Presente de aniversário', amount: 18000, date: day(24, prev), categoryId: cat.compras, paymentMethod: 'pix', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Dentista', amount: 42000, date: day(12, prev), categoryId: cat.saude, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },

        { userId: user.id, description: 'Aluguel', amount: 185000, date: day(4, prev2), categoryId: cat.moradia, paymentMethod: 'transfer', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Mercado do mês', amount: 61200, date: day(7, prev2), categoryId: cat.alimentacao, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },
        { userId: user.id, description: 'Manutenção do carro', amount: 78000, date: day(15, prev2), categoryId: cat.transporte, paymentMethod: 'credit', status: 'paid', recurrence: 'none' },
      ],
    });

    for (const option of createdPays) {
      await tx.expense.updateMany({
        where: { userId: user.id, paymentMethod: option.method },
        data: { paymentOptionId: option.id },
      });
    }

    await tx.income.createMany({
      data: [
        { userId: user.id, description: 'Salário mensal', amount: 780000, date: day(4), categoryId: cat.salario, status: 'received', recurrence: 'monthly' },
        { userId: user.id, description: 'Freelance — landing page', amount: 180000, date: day(11), categoryId: cat.freelance, status: 'received', recurrence: 'none' },
        { userId: user.id, description: 'Dividendos', amount: 23480, date: day(14), categoryId: cat.investimentos, status: 'received', recurrence: 'none' },
        { userId: user.id, description: 'Bônus trimestral', amount: 120000, date: day(27), categoryId: cat['outras-receitas'], status: 'pending', recurrence: 'none' },
        { userId: user.id, description: 'Salário mensal', amount: 780000, date: day(4, prev), categoryId: cat.salario, status: 'received', recurrence: 'none' },
        { userId: user.id, description: 'Freelance — consultoria', amount: 250000, date: day(18, prev), categoryId: cat.freelance, status: 'received', recurrence: 'none' },
        { userId: user.id, description: 'Salário mensal', amount: 760000, date: day(4, prev2), categoryId: cat.salario, status: 'received', recurrence: 'none' },
      ],
    });

    const chargeAgencia = await tx.charge.create({
      data: {
        userId: user.id,
        clientName: 'Agência Norte',
        description: 'Layout de campanha',
        amount: 150000,
        dueDate: day(9),
        status: 'received',
        receivedAt: day(11),
        recurrence: 'none',
      },
    });
    const chargeClinica = await tx.charge.create({
      data: {
        userId: user.id,
        clientName: 'Clínica Bem Viver',
        description: 'Ajustes no sistema de agendamento',
        amount: 78000,
        dueDate: day(20, prev),
        status: 'received',
        receivedAt: day(22, prev),
        recurrence: 'none',
      },
    });

    await tx.charge.createMany({
      data: [
        { userId: user.id, clientName: 'Studio Vértice', description: 'Desenvolvimento do site institucional', amount: 320000, dueDate: day(22), status: 'pending', recurrence: 'none', notes: 'Segunda parcela de três.' },
        { userId: user.id, clientName: 'Marina Duarte', description: 'Mentoria de carreira — 4 sessões', amount: 96000, dueDate: daysFromNow(5), status: 'pending', recurrence: 'monthly' },
        { userId: user.id, clientName: 'Padaria do Bairro', description: 'Manutenção mensal do sistema', amount: 45000, dueDate: daysAgo(6), status: 'pending', recurrence: 'monthly', notes: 'Cliente pediu para reenviar o boleto.' },
        { userId: user.id, clientName: 'Rafael Antunes', description: 'Empréstimo pessoal', amount: 60000, dueDate: daysAgo(15), status: 'pending', recurrence: 'none' },
        { userId: user.id, clientName: 'Lucas Prado', description: 'Projeto cancelado pelo cliente', amount: 40000, dueDate: day(15, prev), status: 'canceled', recurrence: 'none' },
      ],
    });

    await tx.income.create({
      data: {
        userId: user.id,
        description: 'Agência Norte — Layout de campanha',
        amount: 150000,
        date: day(11),
        categoryId: cat.cobrancas,
        status: 'received',
        recurrence: 'none',
        chargeId: chargeAgencia.id,
      },
    });
    await tx.income.create({
      data: {
        userId: user.id,
        description: 'Clínica Bem Viver — Ajustes no sistema',
        amount: 78000,
        date: day(22, prev),
        categoryId: cat.cobrancas,
        status: 'received',
        recurrence: 'none',
        chargeId: chargeClinica.id,
      },
    });
  });

  console.log(`Seeded demo account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
