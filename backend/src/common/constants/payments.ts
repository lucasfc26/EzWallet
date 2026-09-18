import { PaymentMethod } from '@prisma/client';

export const DEFAULT_PAYMENT_OPTIONS: { slug: string; name: string; method: PaymentMethod }[] = [
  { slug: 'pix', name: 'Pix', method: PaymentMethod.pix },
  { slug: 'debit', name: 'Cartão de débito', method: PaymentMethod.debit },
  { slug: 'credit', name: 'Cartão de crédito', method: PaymentMethod.credit },
  { slug: 'cash', name: 'Dinheiro', method: PaymentMethod.cash },
  { slug: 'boleto', name: 'Boleto', method: PaymentMethod.boleto },
  { slug: 'transfer', name: 'Transferência', method: PaymentMethod.transfer },
];
