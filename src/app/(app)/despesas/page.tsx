import { WalletIcon } from "lucide-react";

import { deleteExpense } from "@/app/(app)/despesas/actions";
import { DeleteRowButton } from "@/components/configuracoes/delete-row-button";
import { AddExpenseButton, EditExpenseButton } from "@/components/despesas/expense-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatDate, formatMonth } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DespesasPage() {
  const expenses = await db.fixedCost.findMany({ orderBy: { mes: "desc" }, take: 12 });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={WalletIcon}
        title="Despesas"
        description="Despesas fixas mensais — cadastro manual."
        actions={<AddExpenseButton />}
      />

      {expenses.length === 0 ? (
        <EmptyState icon={WalletIcon} message="Nenhuma despesa cadastrada ainda." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Ads</TableHead>
              <TableHead className="text-right">Tiny</TableHead>
              <TableHead className="text-right">MEI</TableHead>
              <TableHead className="text-right">Parcela</TableHead>
              <TableHead className="text-right">Outros</TableHead>
              <TableHead className="text-right">Reembolso</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="capitalize">{formatMonth(expense.mes)}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(expense.ads.toString())}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(expense.tiny.toString())}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(expense.mei.toString())}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(expense.parcela.toString())}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(expense.outros.toString())}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(expense.reembolso.toString())}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrencyBRL(expense.total.toString())}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <EditExpenseButton expense={expense} />
                    <DeleteRowButton
                      action={deleteExpense.bind(null, expense.id)}
                      confirmMessage={`Excluir as despesas de ${formatDate(expense.mes)}?`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
