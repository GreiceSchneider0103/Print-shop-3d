# Print Shop 3D — Sistema de Gestão

App Next.js 14+ (App Router, TypeScript, Tailwind, shadcn/ui) para gestão de
uma loja de impressão 3D que vende em Shopee, Mercado Livre, TikTok Shop e
loja física. Substitui aos poucos a planilha "Controle Financeiro 3D",
mantendo-a como fonte de dados via sincronização com o Google Sheets.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Componentes de UI no estilo shadcn/ui (código local em `src/components/ui`,
  já que o registro `ui.shadcn.com` não é acessível neste ambiente de
  desenvolvimento — veja "Componentes de UI" abaixo)
- Prisma 6 + Postgres (Supabase)
- `googleapis` para leitura da planilha "Controle Financeiro 3D"
- Deploy no Vercel, com Vercel Cron para a sincronização horária

## Status — Fase 1

Implementado nesta fase (ver `docs/escopo.md` para o escopo completo):

- Schema Prisma com todas as tabelas da seção 4 do escopo (`prisma/schema.prisma`)
- Estrutura de rotas para os módulos da seção 5 (exceto Precificação,
  Métricas v2 e Atendimento, que ficam para a Fase 3), com dashboards e
  listagens já lendo dados reais do Postgres via Prisma
- Job de sincronização com o Google Sheets (`src/lib/sync`), rodável
  manualmente (`npm run sync:sheets`) ou via `/api/sync/sheets` (protegido
  por `CRON_SECRET`, chamado pelo Vercel Cron a cada hora — `vercel.json`)
- Log de sincronização (tabela `sync_logs`, visível em Configurações → Sincronização)

Fora do escopo desta fase (conforme roadmap): edição manual de configurações,
Kanban de produção com baixa automática de estoque, cálculo automático de
custo unitário pela ficha técnica, e os módulos reaproveitados do GitHub
(Precificação / Métricas v2 / Atendimento).

## Setup

### 1. Banco de dados (Supabase)

Crie um projeto no [Supabase](https://supabase.com) e copie as duas
connection strings (Project Settings → Database): a **pooled** (porta 6543,
`pgbouncer=true`) para `DATABASE_URL`, e a **direta** (porta 5432) para
`DIRECT_URL`. Veja `.env.example`.

```bash
cp .env.example .env.local
# preencha DATABASE_URL e DIRECT_URL
npm install
npm run db:push   # cria as tabelas a partir do prisma/schema.prisma
```

Para gerenciar como migrations versionadas em vez de `db push`, use
`npm run db:migrate` a partir daqui.

### 2. Google Sheets (service account)

1. No [Google Cloud Console](https://console.cloud.google.com), crie uma
   service account e uma chave JSON, com a Google Sheets API habilitada.
2. Compartilhe a planilha "Controle Financeiro 3D" com o e-mail da service
   account com permissão de **Editor** (não só Leitor/Viewer) — a esteira
   de Produção precisa gravar na planilha, além de ler (ver
   `src/lib/sync/mark-production-done.ts`). Só leitura funciona para todo
   o resto da sincronização, mas a marcação automática da caixinha
   "produzido" falha silenciosamente (vira aviso no Kanban) sem Editor.
3. Preencha no `.env.local`: `GOOGLE_SHEETS_SPREADSHEET_ID`,
   `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
4. Os nomes das abas assumidos por padrão estão em
   `src/lib/sync/config.ts` (Vendas, CMV, Taxas, Fixos, Config Operação,
   Prazos, Produção (2)) — ajuste ali ou via variáveis de ambiente
   (`SHEET_TAB_*`) se os nomes reais da planilha forem diferentes.

Rodar a sincronização localmente:

```bash
npm run sync:sheets
```

### 3. Deploy no Vercel

- Configure as variáveis de ambiente do `.env.example` no projeto Vercel,
  incluindo um `CRON_SECRET` (qualquer string aleatória forte) — o Vercel
  Cron adiciona automaticamente o header `Authorization: Bearer
  $CRON_SECRET` nas chamadas agendadas.
- O cron em `vercel.json` chama `/api/sync/sheets` a cada hora, replicando
  a cadência do Apps Script atual.

## Componentes de UI

O CLI do shadcn/ui (`ui.shadcn.com`) não é acessível a partir deste ambiente
de desenvolvimento sandboxed, então os componentes em `src/components/ui`
foram escritos manualmente seguindo o padrão shadcn/ui (Radix + CVA +
Tailwind), com `components.json` já configurado. Em um ambiente com acesso
normal à internet, novos componentes podem ser adicionados normalmente com
`npx shadcn@latest add <componente>`.

## Scripts

- `npm run dev` — ambiente de desenvolvimento
- `npm run build` / `npm run start` — build e produção
- `npm run lint` — ESLint
- `npm run db:push` / `npm run db:migrate` / `npm run db:studio` — Prisma
- `npm run sync:sheets` — roda a sincronização com o Google Sheets manualmente
