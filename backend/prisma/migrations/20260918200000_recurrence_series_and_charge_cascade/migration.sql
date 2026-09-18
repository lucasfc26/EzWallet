-- Forever/installment series on incomes and charges (0 = Sempre).
ALTER TABLE "incomes" ADD COLUMN "recurrence_count" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "incomes" ADD COLUMN "recurrence_group_id" TEXT;
ALTER TABLE "incomes" ADD COLUMN "recurrence_index" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "charges" ADD COLUMN "recurrence_count" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "charges" ADD COLUMN "recurrence_group_id" TEXT;
ALTER TABLE "charges" ADD COLUMN "recurrence_index" INTEGER NOT NULL DEFAULT 1;

-- Deleting a received charge must also drop the booked income (saldo).
ALTER TABLE "incomes" DROP CONSTRAINT "incomes_charge_id_fkey";
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
