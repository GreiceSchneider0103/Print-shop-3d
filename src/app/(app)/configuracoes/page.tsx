import {
  ClockIcon,
  PercentIcon,
  RefreshCwIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TargetIcon,
  WalletIcon,
} from "lucide-react";

import { deleteChannelFee, deleteDeadline, deleteFixedCost } from "@/app/(app)/configuracoes/actions";
import { ChannelBadge } from "@/components/channel-badge";
import { AddChannelFeeButton, EditChannelFeeButton } from "@/components/configuracoes/channel-fee-form";
import { AddDeadlineButton, EditDeadlineButton } from "@/components/configuracoes/deadline-form";
import { DeleteRowButton } from "@/components/configuracoes/delete-row-button";
import { AddFixedCostButton, EditFixedCostButton } from "@/components/configuracoes/fixed-cost-form";
import { EditOperationConfigButton } from "@/components/configuracoes/operation-config-form";
import { EditRevenueGoalButton } from "@/components/configuracoes/revenue-goal-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SyncNowButton } from "@/components/sync-now-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatDate, formatDateTime, formatMonth, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";
// Server Action nesta página chama o sync completo (7 abas) — precisa de
// mais que o timeout padrão de function na Vercel.
export const maxDuration = 60;

export default async function ConfiguracoesPage() {
  const [channelFees, fixedCosts, operationConfig, deadlines, syncLogs, revenueGoal] = await Promise.all([
    db.channelFee.findMany({ orderBy: [{ canal: "asc" }, { valorMin: "asc" }] }),
    db.fixedCost.findMany({ orderBy: { mes: "desc" }, take: 12 }),
    db.operationConfig.findFirst({ orderBy: { atualizadoEm: "desc" } }),
    db.deadline.findMany({ orderBy: { canal: "asc" } }),
    db.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
    db.revenueGoal.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={SettingsIcon}
        title="Configurações"
        description="Dados vêm da sincronização com o Google Sheets, mas também podem ser editados aqui."
        actions={<SyncNowButton />}
      />

      <Tabs defaultValue="taxas">
        <TabsList>
          <TabsTrigger value="taxas">
            <PercentIcon />
            Taxas por canal
          </TabsTrigger>
          <TabsTrigger value="fixos">
            <WalletIcon />
            Custos fixos
          </TabsTrigger>
          <TabsTrigger value="operacao">
            <SlidersHorizontalIcon />
            Config. operação
          </TabsTrigger>
          <TabsTrigger value="prazos">
            <ClockIcon />
            Prazos
          </TabsTrigger>
          <TabsTrigger value="meta">
            <TargetIcon />
            Meta
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCwIcon />
            Sincronização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taxas" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <AddChannelFeeButton />
          </div>
          {channelFees.length === 0 ? (
            <EmptyState icon={PercentIcon} message="Nenhuma taxa cadastrada ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Faixa</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-right">Taxa fixa</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <ChannelBadge canal={fee.canal} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(fee.valorMin.toString())} – {formatCurrencyBRL(fee.valorMax.toString())}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(Number(fee.comissaoPct))}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(fee.taxaFixa.toString())}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {fee.observacao ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EditChannelFeeButton fee={fee} />
                        <DeleteRowButton
                          action={deleteChannelFee.bind(null, fee.id)}
                          confirmMessage={`Excluir a faixa de ${fee.canal}?`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="fixos" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <AddFixedCostButton />
          </div>
          {fixedCosts.length === 0 ? (
            <EmptyState icon={WalletIcon} message="Nenhum custo fixo cadastrado ainda." />
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
                {fixedCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="capitalize">{formatMonth(cost.mes)}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(cost.ads.toString())}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(cost.tiny.toString())}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(cost.mei.toString())}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(cost.parcela.toString())}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(cost.outros.toString())}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(cost.reembolso.toString())}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrencyBRL(cost.total.toString())}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EditFixedCostButton cost={cost} />
                        <DeleteRowButton
                          action={deleteFixedCost.bind(null, cost.id)}
                          confirmMessage={`Excluir os custos fixos de ${formatDate(cost.mes)}?`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="operacao">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Parâmetros vigentes</CardTitle>
              <EditOperationConfigButton config={operationConfig} />
            </CardHeader>
            <CardContent>
              {operationConfig ? (
                <div className="grid grid-cols-2 gap-y-2 text-sm sm:max-w-md">
                  <span className="text-muted-foreground">Potência da impressora</span>
                  <span>{Number(operationConfig.potenciaImpressora)} W</span>
                  <span className="text-muted-foreground">Tarifa de energia</span>
                  <span>{formatCurrencyBRL(operationConfig.tarifaEnergia.toString())}/kWh</span>
                  <span className="text-muted-foreground">Custo energia/hora</span>
                  <span>{formatCurrencyBRL(operationConfig.custoEnergiaHora.toString())}</span>
                  <span className="text-muted-foreground">Mão de obra/hora</span>
                  <span>{formatCurrencyBRL(operationConfig.maoObraHora.toString())}</span>
                  <span className="text-muted-foreground">Depreciação/manutenção</span>
                  <span>{formatCurrencyBRL(operationConfig.depreciacaoManutencao.toString())}</span>
                  <span className="text-muted-foreground">Atualizado em</span>
                  <span>{formatDate(operationConfig.atualizadoEm)}</span>
                </div>
              ) : (
                <EmptyState icon={SlidersHorizontalIcon} message="Nenhuma configuração cadastrada ainda." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prazos" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <AddDeadlineButton />
          </div>
          {deadlines.length === 0 ? (
            <EmptyState icon={ClockIcon} message="Nenhum prazo cadastrado ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Prazo (dias úteis)</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <ChannelBadge canal={d.canal} />
                    </TableCell>
                    <TableCell>{d.diasUteisPrazo}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">{d.observacao ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EditDeadlineButton deadline={d} />
                        <DeleteRowButton
                          action={deleteDeadline.bind(null, d.id)}
                          confirmMessage={`Excluir o prazo de ${d.canal}?`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="meta">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Meta de faturamento mensal</CardTitle>
              <EditRevenueGoalButton metaMensal={revenueGoal ? Number(revenueGoal.metaMensal) : 0} />
            </CardHeader>
            <CardContent>
              {revenueGoal && Number(revenueGoal.metaMensal) > 0 ? (
                <div className="grid grid-cols-2 gap-y-2 text-sm sm:max-w-md">
                  <span className="text-muted-foreground">Meta mensal</span>
                  <span>{formatCurrencyBRL(revenueGoal.metaMensal.toString())}</span>
                  <span className="text-muted-foreground">Atualizado em</span>
                  <span>{formatDate(revenueGoal.atualizadoEm)}</span>
                </div>
              ) : (
                <EmptyState icon={TargetIcon} message="Nenhuma meta cadastrada ainda — usada como referência no gráfico do Dashboard Mensal." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          {syncLogs.length === 0 ? (
            <EmptyState icon={RefreshCwIcon} message="Nenhuma sincronização executada ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aba</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processados</TableHead>
                  <TableHead>Ignorados</TableHead>
                  <TableHead>Iniciado em</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.sheetTab ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "SUCCESS" ? "success" : log.status === "ERROR" ? "destructive" : "warning"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.recordsProcessed}</TableCell>
                    <TableCell className={log.recordsSkipped > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                      {log.recordsSkipped}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(log.startedAt)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate text-xs">
                      {log.errorMessage ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
