-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('paid', 'pending');

-- CreateEnum
CREATE TYPE "IncomeStatus" AS ENUM ('received', 'pending');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('pending', 'received', 'canceled');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('none', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('pix', 'debit', 'credit', 'cash', 'boleto', 'transfer');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "category_id" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "status" "ExpenseStatus" NOT NULL,
    "due_date" DATE,
    "notes" TEXT,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incomes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "category_id" TEXT NOT NULL,
    "status" "IncomeStatus" NOT NULL,
    "charge_id" TEXT,
    "notes" TEXT,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "ChargeStatus" NOT NULL,
    "received_at" DATE,
    "notes" TEXT,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "expenses_user_id_date_idx" ON "expenses"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "incomes_charge_id_key" ON "incomes"("charge_id");

-- CreateIndex
CREATE INDEX "incomes_user_id_date_idx" ON "incomes"("user_id", "date");

-- CreateIndex
CREATE INDEX "charges_user_id_due_date_idx" ON "charges"("user_id", "due_date");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
