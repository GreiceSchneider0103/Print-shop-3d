# Escopo do Projeto — Sistema de Gestão para Loja de Impressão 3D

## 1. Contexto

Hoje o controle é feito em uma planilha Google Sheets ("Controle Financeiro 3D") alimentada por um Apps Script conectado ao Tiny ERP, que atualiza pedidos de hora em hora e traz o CMV dos produtos. A operação vende em **Shopee, Mercado Livre, TikTok Shop e loja física**, e o produto é fabricado por impressão 3D sob demanda.

A planilha atual já resolve, de forma manual/fórmulas, os seguintes pontos — que servem de **especificação funcional** para o sistema novo:

- Dashboard geral e mensal (faturamento, margem, nº pedidos, ticket médio, margem líquida %)
- Faturamento e margem por canal
- Ranking de produtos por margem/faturamento
- Análise por pedido (linha a linha, com comissão, frete, CMV, margem)
- Análise agregada por produto/SKU
- Cadastro de CMV por SKU, com variação de preço por canal (ML, Shopee, TikTok) e tempo de produção
- Tabela de taxas/comissão por canal e por faixa de valor (Shopee tem 5 faixas, ML, TikTok, etc.)
- Custos fixos mensais (ads, Tiny, MEI, parcelas, outros)
- Configuração de custo operacional (energia da impressora, mão de obra, depreciação)
- Ficha técnica de consumo de filamento por SKU (múltiplos filamentos por peça, em gramas)
- Fila de produção agrupada por pedido/SKU com prazo de postagem
- "Esteira" — motor que cruza ficha técnica + fila de produção → necessidade de compra de filamento por cor, saldo de estoque e rolos a comprar

Esse é o "cérebro" que o sistema novo precisa replicar e expandir com uma interface de verdade.

## 2. Objetivo

Construir uma aplicação web (deploy no Vercel) que substitua a planilha como ferramenta do dia a dia, mantendo o Sheets/Tiny como fonte de dados (por enquanto), com:

- Dashboards executivos (geral e mensal) por canal e por produto
- Gestão de produção organizada por ordem/fila
- Cadastro e controle de estoque de insumos (filamentos e outros)
- Reaproveitamento dos módulos que você já tem no GitHub: **Precificação**, **Métricas v2** e **Atendimento**
- Espaço para crescer: alertas, automações, integrações diretas com marketplaces

## 3. Stack sugerida

| Camada | Sugestão | Motivo |
|---|---|---|
| Frontend/Fullstack | **Next.js 14+ (App Router) + TypeScript** | Deploy nativo no Vercel, SSR/ISR para dashboards |
| UI | Tailwind CSS + shadcn/ui + Recharts (ou Tremor) | Componentes prontos de dashboard/gráficos |
| Banco de dados | **Postgres (Supabase ou Neon)** | Relacional, encaixa no modelo de pedidos/SKU/estoque; Supabase já dá auth + realtime de graça |
| ORM | Prisma ou Drizzle | Migrations e type-safety |
| Sincronização de dados | Job/cron (Vercel Cron ou Supabase Edge Function) lendo a **Google Sheets API** e/ou **API do Tiny ERP** | Mantém o Apps Script como está no começo, só "lemos" a planilha; depois trocamos por integração direta |
| Auth | Supabase Auth ou Clerk | Login simples (você + eventual equipe) |
| Hospedagem | Vercel | Confirmado pelo pedido |

> Observação: dá pra começar **lendo direto o Google Sheets** (via `googleapis`, service account) sem migrar nada, e ir "internalizando" os dados no Postgres aos poucos (import incremental). Isso evita ter que reescrever o Apps Script logo de cara.

## 4. Modelo de dados (tabelas principais)

Baseado 1:1 nas abas da planilha:

```
orders (pedidos)                    ← aba "Vendas" / "Análise"
  id, numero_pedido, numero_ecommerce, data_venda, sku, produto,
  quantidade, valor_total, comissao, frete_cliente, frete_empresa,
  canal, uf, situacao, cliente_nome, criado_em, atualizado_em

products (produtos/SKU)             ← aba "CMV"
  sku (PK), produto, custo_unitario, tempo_producao_min,
  tipo_anuncio_ml, dias_preparo_ml, preco_ml, preco_shopee, preco_tiktok

product_recipe (ficha técnica)      ← aba "Ficha Técnica"
  sku (FK), filamento, gramas, ordem (1 ou 2, permite múltiplos)

channel_fees (taxas por canal)      ← aba "Taxas"
  canal, valor_min, valor_max, comissao_pct, taxa_fixa, observacao

fixed_costs (custos fixos)          ← aba "Fixos"
  mes, ads, tiny, mei, outros, parcela, total, reembolso

operation_config (config operação)  ← aba "Config Operação"
  potencia_impressora, tarifa_energia, custo_energia_hora,
  mao_obra_hora, depreciacao_manutencao

production_queue (fila de produção) ← aba "Produção (1)"
  pedido, cliente, sku, produto, quantidade, prazo_postagem,
  canal, status (a produzir / em produção / produzido / postado)

inventory (estoque de insumos)      ← aba "Esteira" (estoque atual)
  insumo (ex: "PLA Branco"), tipo (filamento/outro), estoque_atual_g,
  estoque_minimo_g, custo_por_kg, fornecedor, atualizado_em

inventory_movements (nova — não existe na planilha)
  insumo, tipo (entrada/saída/ajuste), quantidade, motivo,
  pedido_relacionado, data

deadlines (prazos por canal)        ← aba "Prazos"
  canal, dias_uteis_prazo, observacao
```

## 5. Módulos do sistema

### 5.1 Dashboard Geral
- Cards: faturamento total, margem R$, margem %, margem líquida R$/%, nº pedidos, itens vendidos, ticket médio
- Faturamento e margem por canal (tabela + gráfico de barras/pizza)
- Top produtos por margem e por faturamento (rankings, como já existe)
- Filtro de período livre (não só mês corrente)
- Comparativo período vs período anterior (% de crescimento)

### 5.2 Dashboard Mensal
- Resumo mensal em série histórica (igual à aba "Geral"): faturamento, margem, custos fixos, lucro líquido real por mês
- Gráfico de evolução mensal (linha)
- Drill-down: clicar no mês abre os pedidos daquele mês

### 5.3 Vendas / Pedidos
- Listagem de todos os pedidos (equivalente à aba "Vendas"/"Análise"), com filtros por canal, situação, período, SKU, UF
- Detalhe do pedido com breakdown de comissão, frete, CMV, margem
- Situação da venda (Entregue, Cancelado, etc.) com contagem de cancelamento/reembolso — **isso já existe implícito nos dados mas não tem uma visão dedicada**; vale um painel de "pedidos com problema"

### 5.4 Análise por Produto
- Equivalente à aba "AnáliseProduto": SKU, qtd vendida, faturamento, margem R$/%, comparativo mês atual vs histórico
- Curva ABC de produtos (quais 20% dos SKUs geram 80% da margem)

### 5.5 Produção
- Fila de produção agrupada por ordem de prioridade (prazo de postagem mais próximo primeiro)
- Kanban simples: A produzir → Em produção → Produzido → Postado
- Agrupamento automático por SKU (produzir várias peças iguais juntas economiza troca de filamento/cor)
- Ao marcar um item como "produzido", já **baixar o estoque de insumo automaticamente** pela ficha técnica (isso a planilha não faz — é ganho real)
- Etiqueta/checklist de separação por pedido

### 5.6 Insumos / Estoque
- Cadastro de insumos (filamentos e outros: parafusos, embalagem, etc.)
- Estoque atual, estoque mínimo, alerta visual quando abaixo do mínimo
- Necessidade de compra calculada automaticamente (fila de produção pendente × ficha técnica) — igual à aba "Esteira", mas em tempo real
- Sugestão de compra em rolos (1kg) ou na unidade que fizer sentido
- Histórico de movimentação de estoque (entradas/saídas) — **novo**, não existe na planilha

### 5.7 Ficha Técnica
- Cadastro de SKU → filamentos e gramas (permitir N filamentos, não só 2)
- Tempo de produção, dias de preparo por canal
- Custo unitário calculado automaticamente a partir da ficha técnica × custo do filamento/kg + energia + mão de obra (a planilha hoje pede pra digitar manual; dá pra automatizar)

### 5.8 Configurações
- Taxas por canal e faixa (igual "Taxas")
- Custos fixos mensais (igual "Fixos")
- Parâmetros operacionais: potência da impressora, tarifa de energia, mão de obra/hora, depreciação (igual "Config Operação")
- Prazos por canal (igual "Prazos")
- Cadastro de canais de venda (hoje: Shopee, ML, TikTok, WhatsApp/loja física — deixar extensível)

### 5.9 Módulos reaproveitados do seu GitHub
- **Precificação**: acoplar como módulo de simulação de preço por produto, puxando custo (ficha técnica + insumos) e taxas por canal direto do banco novo, em vez de dados avulsos
- **Métricas v2**: usar como base de componentes de gráfico/KPI para os dashboards acima, evitando reconstruir do zero
- **Atendimento**: módulo separado (provavelmente CRM/chat de suporte) — mantido como está ou integrado ao pedido (ex: abrir atendimento a partir de um pedido com problema)

> Para isso funcionar bem, o ideal é estruturar como **monorepo** (Turborepo) com um pacote de UI compartilhado (`packages/ui`) e cada app como seu próprio workspace, ou então portar os componentes desses três projetos para dentro deste novo app como módulos/rotas. Quando você tiver os links dos repositórios, consigo revisar a estrutura deles e definir a melhor forma de integração — isso deve ser um dos primeiros passos junto com o Claude Code.

## 6. Funcionalidades extras sugeridas (não estavam pedidas, mas fazem falta em operações assim)

- **Alertas automáticos**: estoque baixo, pedido atrasado (passou do prazo de postagem), meta de faturamento do mês
- **Metas**: definir meta mensal de faturamento/margem e acompanhar progresso no dashboard
- **DRE simplificado**: visão de lucro líquido real puxando faturamento − CMV − comissões − fretes − custos fixos, já pronta pra imposto (MEI)
- **Reconciliação de repasse**: comparar o que o canal diz que vai repassar vs o que efetivamente cai na conta (ainda mais importante com múltiplos canais)
- **Multiusuário/permissões**: se em algum momento tiver alguém te ajudando na produção, ele só vê a aba de produção, não o financeiro
- **Exportação**: relatório mensal em PDF/Excel para contador (MEI)
- **Histórico de preço de filamento**: pra saber se o custo de insumo está subindo
- **Previsão de compra**: baseado na velocidade de venda dos últimos X dias, sugerir quando comprar filamento antes de faltar (não só reativo)
- **Mobile-first na tela de Produção**: você provavelmente vai olhar a fila de produção do celular, do lado da impressora
- **Log de sincronização**: mostrar quando foi a última vez que os dados do Sheets/Tiny foram puxados, e erros de sync

## 7. Roadmap sugerido

**Fase 1 — MVP (2-3 semanas de trabalho com Claude Code)**
1. Setup do projeto (Next.js + Postgres + Vercel) e schema do banco
2. Job de sincronização lendo a planilha atual (Google Sheets API) → popula `orders`, `products`, `product_recipe`, `channel_fees`, `fixed_costs`, `operation_config`
3. Dashboard Geral + Mensal (somente leitura, replicando os KPIs da planilha)
4. Tela de Vendas/Pedidos com filtros

**Fase 2 — Produção e Estoque**
5. Fila de Produção (Kanban) com baixa automática de estoque
6. Cadastro de Insumos + cálculo de necessidade de compra em tempo real
7. Ficha Técnica editável

**Fase 3 — Integração dos módulos existentes**
8. Portar/integrar Precificação, Métricas v2 e Atendimento
9. Alertas, metas, DRE

**Fase 4 — Independência da planilha**
10. Trocar leitura do Sheets por API direta do Tiny (ou dos marketplaces), aposentando o Apps Script

## 8. Primeiro prompt para o Claude Code

Ao abrir o projeto no Claude Code, o primeiro prompt pode ser algo como:

> "Vamos criar um app Next.js 14 (App Router, TypeScript, Tailwind, shadcn/ui) para deploy no Vercel, com Postgres (Supabase) via Prisma. Este é o escopo completo do projeto: [colar este documento]. Comece pela Fase 1: monte o schema do Prisma para as tabelas descritas na seção 4, crie a estrutura de rotas para os módulos da seção 5, e implemente o job de sincronização que lê a planilha Google Sheets (vou te passar o ID da planilha e as credenciais depois) para popular o banco. Não implemente ainda os módulos de Precificação/Métricas v2/Atendimento — vamos tratar disso na Fase 3."
