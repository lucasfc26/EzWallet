import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Moon, Pencil, Plus, Sun, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/finance/PageHeader";
import { CategoryIcon, CATEGORY_ICON_MAP } from "../../components/finance/CategoryBadge";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { CurrencyInput } from "../../components/ui/CurrencyInput";
import { Tabs } from "../../components/ui/Tabs";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useAuth, authErrorMessage, type AuthUser } from "../../hooks/useAuth";
import { useFinance } from "../../hooks/useFinance";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import {
  CARD_BRANDS,
  CARD_KINDS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  formatCardLabel,
  PAYMENT_METHODS,
  paymentSelectOptions,
  decodePaymentValue,
} from "../../data/categories";
import type {
  CardBrand,
  CardKind,
  Category,
  CategoryKind,
  PaymentCard,
  PaymentMethodId,
  PaymentOption,
} from "../../types";
import { cn } from "../../utils/cn";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().email("Informe um e-mail válido"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirme a nova senha"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const cardSchema = z.object({
  brand: z.enum(["visa", "mastercard", "elo", "amex", "hipercard", "other"]),
  kind: z.enum(["credit", "debit"]),
  last4: z.string().regex(/^\d{4}$/, "Informe os 4 últimos dígitos"),
});

const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  kind: z.enum(["expense", "income"]),
  icon: z.string().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/),
});

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { cards, categories, paymentOptions, createCard, updateCard, removeCard, createCategory, updateCategory, removeCategory, createPaymentOption, updatePaymentOption, removePaymentOption } =
    useFinance();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [cardModal, setCardModal] = useState<PaymentCard | "new" | null>(null);
  const [paymentModal, setPaymentModal] = useState<PaymentOption | "new" | null>(null);
  const [categoryModal, setCategoryModal] = useState<Category | "new" | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [catalogTab, setCatalogTab] = useState<"expense" | "income" | "payment">("expense");

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      toast("Dados pessoais atualizados.");
    } catch (err) {
      toast(authErrorMessage(err, "Não foi possível salvar o perfil."), { variant: "error" });
    }
  });

  const onSavePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      passwordForm.reset();
      toast("Senha alterada com sucesso.");
    } catch (err) {
      toast(authErrorMessage(err, "Não foi possível alterar a senha."), { variant: "error" });
    }
  });

  const visibleCategories = categories.filter((c) => c.kind === catalogTab);

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Perfil, teto de gastos, formas de pagamento e categorias da sua conta."
      />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Aparência" description="Escolha entre o tema claro e o escuro." />
          <CardBody className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
                theme === "light"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-foreground-secondary hover:bg-surface-secondary",
              )}
            >
              <Sun className="h-4 w-4" />
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
                theme === "dark"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-foreground-secondary hover:bg-surface-secondary",
              )}
            >
              <Moon className="h-4 w-4" />
              Escuro
            </button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Dados pessoais" description="Nome e e-mail usados no login." />
          <CardBody>
            <form onSubmit={onSaveProfile} className="grid gap-4 sm:grid-cols-2">
              <Input id="profile-name" label="Nome" error={profileForm.formState.errors.name?.message} {...profileForm.register("name")} />
              <Input id="profile-email" type="email" label="E-mail" error={profileForm.formState.errors.email?.message} {...profileForm.register("email")} />
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" loading={profileForm.formState.isSubmitting}>
                  Salvar perfil
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <SpendCapSettings user={user} onSave={updateProfile} />

        <DefaultExpenseSettings
          user={user}
          categories={categories}
          paymentOptions={paymentOptions}
          cards={cards}
          onSave={updateProfile}
        />

        <Card>
          <CardHeader title="Alterar senha" description="Informe a senha atual e a nova senha." />
          <CardBody>
            <form onSubmit={onSavePassword} className="grid gap-4 sm:grid-cols-3">
              <Input id="current-password" type="password" label="Senha atual" autoComplete="current-password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register("currentPassword")} />
              <Input id="new-password" type="password" label="Nova senha" autoComplete="new-password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register("newPassword")} />
              <Input id="confirm-password" type="password" label="Confirmar senha" autoComplete="new-password" error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register("confirmPassword")} />
              <div className="sm:col-span-3 flex justify-end">
                <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                  Atualizar senha
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Cartões"
            description="Bandeira e os 4 últimos dígitos entram na forma de pagamento."
            action={
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCardModal("new")}>
                Novo cartão
              </Button>
            }
          />
          {cards.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-foreground-secondary">Nenhum cartão cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[11.5px] font-medium uppercase tracking-wide text-foreground-secondary">
                    <th className="px-5 py-3">Cartão</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Final</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cards.map((card) => (
                    <tr key={card.id}>
                      <td className="px-5 py-3 text-[13.5px] font-medium text-foreground">
                        {formatCardLabel(card)}
                      </td>
                      <td className="px-3 py-3 text-[13px] text-foreground-secondary">
                        {card.kind === "credit" ? "Crédito" : "Débito"}
                      </td>
                      <td className="px-3 py-3 text-[13px] tabular-nums text-foreground-secondary">
                        {card.last4}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Editar cartão" onClick={() => setCardModal(card)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Excluir cartão" onClick={() => setDeleteCardId(card.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Categorias e pagamentos"
            description="O que você criar, editar ou excluir vale só para a sua conta."
            action={
              catalogTab === "payment" ? (
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setPaymentModal("new")}>
                  Nova forma
                </Button>
              ) : (
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCategoryModal("new")}>
                  Nova categoria
                </Button>
              )
            }
          />
          <div className="px-5 pt-3">
            <Tabs
              paged
              value={catalogTab}
              onChange={setCatalogTab}
              items={[
                { value: "expense", label: "Despesas", count: categories.filter((c) => c.kind === "expense").length },
                { value: "income", label: "Receitas", count: categories.filter((c) => c.kind === "income").length },
                { value: "payment", label: "Pagamentos", count: paymentOptions.length },
              ]}
            />
          </div>
          {catalogTab === "payment" ? (
            paymentOptions.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-foreground-secondary">Nenhuma forma de pagamento cadastrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="mt-2 w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-[11.5px] font-medium uppercase tracking-wide text-foreground-secondary">
                      <th className="px-5 py-3">Nome</th>
                      <th className="px-3 py-3">Tipo</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentOptions.map((option) => (
                      <tr key={option.id}>
                        <td className="px-5 py-3 text-[13.5px] font-medium text-foreground">
                          {option.name}
                          {option.slug && <span className="ml-2 text-[11px] font-normal text-foreground-muted">Padrão</span>}
                        </td>
                        <td className="px-3 py-3 text-[13px] text-foreground-secondary">
                          {PAYMENT_METHODS.find((p) => p.id === option.method)?.label ?? option.method}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" aria-label="Editar forma" onClick={() => setPaymentModal(option)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Excluir forma" onClick={() => setDeletePaymentId(option.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-danger" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="mt-2 w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[11.5px] font-medium uppercase tracking-wide text-foreground-secondary">
                    <th className="px-5 py-3">Categoria</th>
                    <th className="px-3 py-3">Cor</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleCategories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon categoryId={category.id} size="sm" />
                          <div>
                            <p className="text-[13.5px] font-medium text-foreground">{category.name}</p>
                            {category.slug && <p className="text-[11px] text-foreground-muted">Padrão</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Editar categoria" onClick={() => setCategoryModal(category)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir categoria"
                            onClick={() => setDeleteCategoryId(category.id)}
                            disabled={category.slug === "cobrancas" || category.slug === "outros" || category.slug === "outras-receitas"}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <PaymentFormModal
        open={paymentModal !== null}
        option={paymentModal === "new" ? null : paymentModal}
        onClose={() => setPaymentModal(null)}
        onSave={async (input) => {
          if (paymentModal && paymentModal !== "new") await updatePaymentOption(paymentModal.id, input);
          else await createPaymentOption(input);
          toast(paymentModal === "new" ? "Forma de pagamento criada." : "Forma de pagamento atualizada.");
          setPaymentModal(null);
        }}
      />

      <CardFormModal
        open={cardModal !== null}
        card={cardModal === "new" ? null : cardModal}
        onClose={() => setCardModal(null)}
        onSave={async (input) => {
          if (cardModal && cardModal !== "new") await updateCard(cardModal.id, input);
          else await createCard(input);
          toast(cardModal === "new" ? "Cartão cadastrado." : "Cartão atualizado.");
          setCardModal(null);
        }}
      />

      <CategoryFormModal
        open={categoryModal !== null}
        category={categoryModal === "new" ? null : categoryModal}
        defaultKind={catalogTab === "payment" ? "expense" : catalogTab}
        onClose={() => setCategoryModal(null)}
        onSave={async (input) => {
          if (categoryModal && categoryModal !== "new") {
            const { kind: _kind, ...patch } = input;
            await updateCategory(categoryModal.id, patch);
          } else {
            await createCategory(input);
          }
          toast(categoryModal === "new" ? "Categoria criada." : "Categoria atualizada.");
          setCategoryModal(null);
        }}
      />

      <ConfirmDialog
        open={deletePaymentId !== null}
        title="Excluir forma de pagamento"
        message="Essa opção sai do seu cadastro. Lançamentos antigos continuam no histórico."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletePaymentId) return;
          await removePaymentOption(deletePaymentId);
          setDeletePaymentId(null);
          toast("Forma de pagamento excluída.", { variant: "info" });
        }}
        onCancel={() => setDeletePaymentId(null)}
      />

      <ConfirmDialog
        open={deleteCardId !== null}
        title="Excluir cartão"
        message="O cartão sai das formas de pagamento. Lançamentos antigos continuam no histórico."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deleteCardId) return;
          await removeCard(deleteCardId);
          setDeleteCardId(null);
          toast("Cartão excluído.", { variant: "info" });
        }}
        onCancel={() => setDeleteCardId(null)}
      />

      <ConfirmDialog
        open={deleteCategoryId !== null}
        title="Excluir categoria"
        message="Os lançamentos dessa categoria serão movidos para Outros."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deleteCategoryId) return;
          try {
            await removeCategory(deleteCategoryId);
            toast("Categoria excluída.", { variant: "info" });
          } catch (err) {
            toast(authErrorMessage(err, "Não foi possível excluir a categoria."), { variant: "error" });
          }
          setDeleteCategoryId(null);
        }}
        onCancel={() => setDeleteCategoryId(null)}
      />
    </>
  );
}

function SpendCapSettings({
  user,
  onSave,
}: {
  user: AuthUser | null;
  onSave: (data: { monthlySpendCap: number | null }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [cap, setCap] = useState(user?.monthlySpendCap ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCap(user?.monthlySpendCap ?? 0);
  }, [user?.monthlySpendCap]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ monthlySpendCap: cap > 0 ? cap : null });
      toast(cap > 0 ? "Teto mensal de gastos salvo." : "Teto mensal desativado.");
    } catch (err) {
      toast(authErrorMessage(err, "Não foi possível salvar o teto."), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Teto máximo de gastos"
        description="Avise quando os gastos do mês atual se aproximarem desse valor. Deixe em branco para não limitar."
      />
      <CardBody>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <CurrencyInput
            id="monthly-spend-cap"
            label="Limite do mês"
            hint="O alerta aparece a partir de 80% do valor."
            value={cap}
            onChange={setCap}
          />
          <Button type="button" loading={saving} onClick={() => void handleSave()}>
            Salvar teto
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function DefaultExpenseSettings({
  user,
  categories,
  paymentOptions,
  cards,
  onSave,
}: {
  user: AuthUser | null;
  categories: Category[];
  paymentOptions: PaymentOption[];
  cards: PaymentCard[];
  onSave: (data: {
    defaultCategoryId: string | null;
    defaultPaymentOptionId: string | null;
    defaultPaymentCardId: string | null;
  }) => Promise<void>;
}) {
  const { toast } = useToast();
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const paymentChoices = paymentSelectOptions(paymentOptions, cards);
  const [categoryId, setCategoryId] = useState(user?.defaultCategoryId ?? "");
  const [payment, setPayment] = useState("");
  const [saving, setSaving] = useState(false);

  const expenseCategoryKey = expenseCategories.map((c) => c.id).join(",");
  const paymentChoiceKey = paymentChoices.map((p) => p.value).join(",");

  useEffect(() => {
    if (user?.defaultCategoryId) {
      setCategoryId(user.defaultCategoryId);
      return;
    }
    setCategoryId((current) => current || expenseCategories[0]?.id || "");
  }, [user?.defaultCategoryId, expenseCategoryKey, expenseCategories]);

  useEffect(() => {
    if (user?.defaultPaymentCardId) {
      setPayment(`card:${user.defaultPaymentCardId}`);
      return;
    }
    if (user?.defaultPaymentOptionId) {
      setPayment(`opt:${user.defaultPaymentOptionId}`);
      return;
    }
    setPayment((current) => current || paymentChoices[0]?.value || "");
  }, [user?.defaultPaymentCardId, user?.defaultPaymentOptionId, paymentChoiceKey, paymentChoices]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const decoded = decodePaymentValue(payment);
      await onSave({
        defaultCategoryId: categoryId || null,
        defaultPaymentOptionId: decoded.paymentOptionId ?? null,
        defaultPaymentCardId: decoded.paymentCardId ?? null,
      });
      toast("Padrões do novo gasto salvos.");
    } catch (err) {
      toast(authErrorMessage(err, "Não foi possível salvar os padrões."), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Padrões do novo gasto"
        description="Categoria e forma de pagamento pré-selecionadas ao abrir um lançamento."
      />
      <CardBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="default-category"
            label="Categoria padrão"
            options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          <Select
            id="default-payment"
            label="Pagamento padrão"
            options={paymentChoices}
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" loading={saving} onClick={() => void handleSave()}>
            Salvar padrões
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function PaymentFormModal({
  open,
  option,
  onClose,
  onSave,
}: {
  open: boolean;
  option: PaymentOption | null;
  onClose: () => void;
  onSave: (input: { name: string; method: PaymentMethodId }) => Promise<void>;
}) {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().trim().min(2, "Informe o nome"),
        method: z.enum(["pix", "debit", "credit", "cash", "boleto", "transfer"]),
      }),
    ),
    values: {
      name: option?.name ?? "",
      method: option?.method ?? "pix",
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={option ? "Editar forma de pagamento" : "Nova forma de pagamento"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button form="payment-form" type="submit" loading={form.formState.isSubmitting}>Salvar</Button>
        </div>
      }
    >
      <form
        id="payment-form"
        className="space-y-4 px-5 py-5"
        onSubmit={form.handleSubmit(async (values) => {
          await onSave(values);
        })}
      >
        <Input id="payment-name" label="Nome" error={form.formState.errors.name?.message} {...form.register("name")} />
        <Select
          id="payment-method"
          label="Tipo"
          options={PAYMENT_METHODS.map((p) => ({ value: p.id, label: p.label }))}
          {...form.register("method")}
        />
      </form>
    </Modal>
  );
}

function CardFormModal({
  open,
  card,
  onClose,
  onSave,
}: {
  open: boolean;
  card: PaymentCard | null;
  onClose: () => void;
  onSave: (input: { brand: CardBrand; last4: string; kind: CardKind }) => Promise<void>;
}) {
  const form = useForm({
    resolver: zodResolver(cardSchema),
    values: {
      brand: card?.brand ?? "visa",
      kind: card?.kind ?? "credit",
      last4: card?.last4 ?? "",
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card ? "Editar cartão" : "Novo cartão"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button form="card-form" type="submit" loading={form.formState.isSubmitting}>Salvar</Button>
        </div>
      }
    >
      <form
        id="card-form"
        className="space-y-4 px-5 py-5"
        onSubmit={form.handleSubmit(async (values) => {
          await onSave(values);
        })}
      >
        <Select id="card-brand" label="Bandeira" options={CARD_BRANDS.map((b) => ({ value: b.id, label: b.label }))} {...form.register("brand")} />
        <Select id="card-kind" label="Tipo" options={CARD_KINDS.map((k) => ({ value: k.id, label: k.label }))} {...form.register("kind")} />
        <Input id="card-last4" label="Últimos 4 dígitos" inputMode="numeric" maxLength={4} placeholder="1234" error={form.formState.errors.last4?.message} {...form.register("last4")} />
      </form>
    </Modal>
  );
}

function CategoryFormModal({
  open,
  category,
  defaultKind,
  onClose,
  onSave,
}: {
  open: boolean;
  category: Category | null;
  defaultKind: CategoryKind;
  onClose: () => void;
  onSave: (input: { name: string; kind: CategoryKind; icon: string; color: string }) => Promise<void>;
}) {
  const form = useForm({
    resolver: zodResolver(categorySchema),
    values: {
      name: category?.name ?? "",
      kind: category?.kind ?? defaultKind,
      icon: category?.icon ?? "circle-dashed",
      color: category?.color ?? "#6366f1",
    },
  });
  const icon = form.watch("icon");
  const color = form.watch("color");
  const Icon = CATEGORY_ICON_MAP[icon];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Editar categoria" : "Nova categoria"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button form="category-form" type="submit" loading={form.formState.isSubmitting}>Salvar</Button>
        </div>
      }
    >
      <form
        id="category-form"
        className="space-y-4 px-5 py-5"
        onSubmit={form.handleSubmit(async (values) => {
          await onSave(values);
        })}
      >
        <Input id="category-name" label="Nome" error={form.formState.errors.name?.message} {...form.register("name")} />
        {!category && (
          <Select
            id="category-kind"
            label="Tipo"
            options={[
              { value: "expense", label: "Despesa" },
              { value: "income", label: "Receita" },
            ]}
            {...form.register("kind")}
          />
        )}
        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium text-foreground-secondary">Ícone</span>
          <div className="grid grid-cols-8 gap-1.5">
            {CATEGORY_ICONS.map((name) => {
              const OptionIcon = CATEGORY_ICON_MAP[name];
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => form.setValue("icon", name, { shouldDirty: true })}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border",
                    icon === name
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-foreground-secondary hover:border-foreground-muted",
                  )}
                >
                  {OptionIcon && <OptionIcon className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium text-foreground-secondary">Cor</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => form.setValue("color", hex, { shouldDirty: true })}
                className={cn(
                  "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-surface",
                  color === hex ? "ring-foreground" : "ring-transparent",
                )}
                style={{ backgroundColor: hex }}
                aria-label={hex}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
          <span className="cat-chip flex h-10 w-10 items-center justify-center rounded-xl" style={{ "--cat": color } as React.CSSProperties}>
            {Icon && <Icon className="h-4 w-4" />}
          </span>
          <p className="text-[13px] text-foreground-secondary">Pré-visualização</p>
        </div>
      </form>
    </Modal>
  );
}
