import {
  ClockIcon,
  PercentIcon,
  RefreshCwIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  WalletIcon,
} from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SyncNowButton } from "@/components/sync-now-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatDate, formatDateTime, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";
// Server Action nesta página chama o sync completo (7 abas) — precisa de
// mais que o timeout padrão de function na Vercel.
export const maxDuration = 60;

export default async function ConfiguracoesPage() {
  const [channelFees, fixedCosts, operationConfig, deadlines, syncLogs] = await Promise.all([
    db.channelFee.findMany({ orderBy: [{ canal: "asc" }, { valorMin: "asc" }] }),
    db.fixedCost.findMany({ orderBy: { mes: "desc" }, take: 12 }),
    db.operationConfig.findFirst({ orderBy: { atualizadoEm: "desc" } }),
    db.deadline.findMany({ orderBy: { canal: "asc" } }),
    db.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SettingsIcon}
        title="Configurações"
        description="Dados vêm da sincronização com o Google Sheets. Edição manual entra na Fase 3."
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
          <TabsTrigger value="sync">
            <RefreshCwIcon />
            Sincronização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taxas">
          {channelFees.length === 0 ? (
            <EmptyState icon={PercentIcon} message="Nenhuma taxa sincronizada ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Taxa fixa</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <ChannelBadge canal={fee.canal} />
                    </TableCell>
                    <TableCell>
                      {formatCurrencyBRL(fee.valorMin.toString())} – {formatCurrencyBRL(fee.valorMax.toString())}
                    </TableCell>
                    <TableCell>{formatPercent(Number(fee.comissaoPct))}</TableCell>
                    <TableCell>{formatCurrencyBRL(fee.taxaFixa.toString())}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {fee.observacao ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="fixos">
          {fixedCosts.length === 0 ? (
            <EmptyState icon={WalletIcon} message="Nenhum custo fixo sincronizado ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Ads</TableHead>
                  <TableHead>Tiny</TableHead>
                  <TableHead>MEI</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Outros</TableHead>
                  <TableHead>Reembolso</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>{formatDate(cost.mes)}</TableCell>
                    <TableCell>{formatCurrencyBRL(cost.ads.toString())}</TableCell>
                    <TableCell>{formatCurrencyBRL(cost.tiny.toString())}</TableCell>
                    <TableCell>{formatCurrencyBRL(cost.mei.toString())}</TableCell>
                    <TableCell>{formatCurrencyBRL(cost.parcela.toString())}</TableCell>
                    <TableCell>{formatCurrencyBRL(cost.outros.toString())}</TableCell>
                    <TableCell>{formatCurrencyBRL(cost.reembolso.toString())}</TableCell>
                    <TableCell className="font-medium">{formatCurrencyBRL(cost.total.toString())}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="operacao">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros vigentes</CardTitle>
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
                <EmptyState icon={SlidersHorizontalIcon} message="Nenhuma configuração sincronizada ainda." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prazos">
          {deadlines.length === 0 ? (
            <EmptyState icon={ClockIcon} message="Nenhum prazo sincronizado ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Prazo (dias úteis)</TableHead>
                  <TableHead>Observação</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
