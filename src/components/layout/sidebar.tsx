"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  Truck,
  Settings,
  TrendingUp,
  Store,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/shops", label: "Shops / Khata", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/profit-loss", label: "Profit & Loss", icon: TrendingUp },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-teal-500/20 text-white"
                : "text-teal-50/80 hover:bg-teal-800/60 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 border-b border-teal-700/50 px-5 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 text-white shadow-sm">
        <Store className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-bold tracking-tight text-white">StoreLedger</p>
        <p className="text-xs text-teal-100/70">Inventory & Business</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] lg:flex">
      <SidebarBrand />
      <SidebarNav />
      <div className="mt-auto border-t border-teal-700/50 px-5 py-4 text-xs text-teal-100/60">
        Pakistani retail ready · PKR
      </div>
    </aside>
  );
}
