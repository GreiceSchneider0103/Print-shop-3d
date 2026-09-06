import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Calculator,
  Factory,
  LayoutDashboard,
  LineChart,
  Package,
  Settings,
  ShoppingCart,
  Wrench,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Abre em nova aba em vez de navegar internamente — ex.: o Flush (app de precificação), que é outro projeto. */
  external?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Visão geral",
    items: [
      { href: "/", label: "Dashboard Geral", icon: LayoutDashboard },
      { href: "/mensal", label: "Dashboard Mensal", icon: LineChart },
    ],
  },
  {
    label: "Vendas",
    items: [
      { href: "/vendas", label: "Vendas / Pedidos", icon: ShoppingCart },
      { href: "/produtos", label: "Análise por Produto", icon: Package },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/producao", label: "Produção", icon: Factory },
      { href: "/estoque", label: "Insumos / Estoque", icon: Boxes },
      { href: "/ficha-tecnica", label: "Ficha Técnica", icon: Wrench },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/configuracoes", label: "Configurações", icon: Settings },
      { href: "https://flush3-d.vercel.app/", label: "Flush — Precificação", icon: Calculator, external: true },
    ],
  },
];
