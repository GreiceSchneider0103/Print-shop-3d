import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatDate, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

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
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados vêm da sincronização com o Google Sheets. Edição manual entra na Fase 3.
        </p>
      </div>

      <Tabs defaultValue="taxas">
        <TabsList>
          <TabsTrigger value="taxas">Taxas por canal</TabsTrigger>
          <TabsTrigger value="fixos">Custos fixos</TabsTrigger>
          <TabsTrigger value="operacao">Config. operação</TabsTrigger>
          <TabsTrigger value="prazos">Prazos</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
        </TabsList>

        <TabsContent value="taxas">
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
                    <Badge variant="outline">{fee.canal}</Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrencyBRL(fee.valorMin.toString())} – {formatCurrencyBRL(fee.valorMax.toString())}
                  </TableCell>
                  <TableCell>{formatPercent(Number(fee.comissaoPct))}</TableCell>
                  <TableCell>{formatCurrencyBRL(fee.taxaFixa.toString())}</TableCell>
                  <TableCell className="text-muted-foreground">{fee.observacao ?? "—"}</TableCell>
                </TableRow>
              ))}
              {channelFees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma taxa sincronizada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="fixos">
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
              {fixedCosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum custo fixo sincronizado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="operacao">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros vigentes</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-2 text-sm sm:max-w-md">
              {operationConfig ? (
                <>
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
                </>
              ) : (
                <p className="col-span-2 text-muted-foreground">Nenhuma configuração sincronizada ainda.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prazos">
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
                    <Badge variant="outline">{d.canal}</Badge>
                  </TableCell>
                  <TableCell>{d.diasUteisPrazo}</TableCell>
                  <TableCell className="text-muted-foreground">{d.observacao ?? "—"}</TableCell>
                </TableRow>
              ))}
              {deadlines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum prazo sincronizado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="sync">
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
                  <TableCell>{formatDate(log.startedAt)}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {log.errorMessage ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {syncLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma sincronização executada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
