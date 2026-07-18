"use client";

import { useState } from "react";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarBrand, SidebarNav } from "@/components/layout/sidebar";
import { logoutAction } from "@/lib/actions/auth";

type HeaderProps = {
  title: string;
  userName?: string | null;
  userEmail?: string | null;
};

export function Header({ title, userName, userEmail }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur no-print sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-[var(--sidebar)] p-0 text-white">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBrand />
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h1>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{userName || "Account"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{userName}</span>
              <span className="text-xs font-normal text-slate-500">{userEmail}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onSelect={() => {
              void logoutAction();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
