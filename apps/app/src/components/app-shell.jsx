"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderOpen, Receipt, ListTodo, CalendarClock,
  MessagesSquare, CalendarDays, CheckCheck, BarChart3, UsersRound,
  ScrollText, Settings, Bell, LogOut, ChevronsUpDown, Plus, Menu, X,
} from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, Avatar, Badge, TooltipProvider } from "@steuerberaterflow/ui";
import { cn } from "@steuerberaterflow/ui";
import { ROLE_LABELS } from "@/lib/labels";

const ICONS = {
  dashboard: LayoutDashboard,
  clients: Users,
  documents: FolderOpen,
  receipts: Receipt,
  tasks: ListTodo,
  deadlines: CalendarClock,
  messages: MessagesSquare,
  appointments: CalendarDays,
  approvals: CheckCheck,
  reports: BarChart3,
  team: UsersRound,
  audit: ScrollText,
  settings: Settings,
};

/**
 * App-Shell: Desktop-Sidebar, mobile Drawer-Navigation, Topbar mit
 * Benachrichtigungen und Benutzer-Menü.
 */
export function AppShell({ children, user, orgName, navItems, notifications, showAddClient = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const nav = (
    <nav className="flex-1 overflow-y-auto sf-scroll px-2 py-3 space-y-0.5" aria-label="Hauptnavigation">
      {navItems.map((item) => {
        const Icon = ICONS[item.icon] || LayoutDashboard;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground hover:bg-accent/40"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="flex-1">{item.label}</span>
            {item.count ? (
              <span
                className={cn(
                  "min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full text-[10px] font-semibold",
                  active ? "bg-primary text-white" : "bg-accent text-accent-foreground"
                )}
              >
                {item.count > 99 ? "99+" : item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#176B4D" />
        <path d="M9 21.5L14 13l4 6 5-9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="leading-tight">
        <p className="text-[13px] font-semibold text-foreground">SteuerberaterFlow</p>
        <p className="text-[10px] text-muted truncate max-w-36">{orgName}</p>
      </div>
    </Link>
  );

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer">
          <Avatar name={user.name} size="sm" />
          <span className="hidden md:block text-left">
            <span className="block text-xs font-medium text-foreground leading-tight">{user.name}</span>
            <span className="block text-[10px] text-muted leading-tight">{ROLE_LABELS[user.role]}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        <DropdownMenuItem asChild><Link href="/settings/profile">Persönliche Einstellungen</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/settings">Kanzlei-Einstellungen</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action="/api/auth/logout" method="post">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-danger focus:text-danger">
              <LogOut className="h-3.5 w-3.5" /> Abmelden
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
        {/* Desktop-Sidebar */}
        <aside className="hidden lg:flex flex-col border-r border-border bg-card sticky top-0 h-screen">
          {brand}
          {nav}
          <div className="p-3 border-t border-border">
            {userMenu}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col shadow-xl">
              <div className="flex items-center justify-between pr-2">
                {brand}
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Navigation schließen"
                  className="p-2 rounded-lg hover:bg-accent/50 text-muted cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {nav}
              <div className="p-3 border-t border-border">{userMenu}</div>
            </aside>
          </div>
        ) : null}

        {/* Hauptbereich */}
        <div className="flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 lg:px-6 border-b border-border bg-card/90 backdrop-blur">
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent/50 text-foreground cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Navigation öffnen"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm font-medium text-muted truncate hidden sm:block">{orgName}</p>
            <div className="flex-1" />
            <NotificationBell notifications={notifications} />
            {showAddClient ? (
              <Link
                href="/clients/new"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover"
              >
                <Plus className="h-3.5 w-3.5" /> Mandant
              </Link>
            ) : null}
          </header>
          <main id="main" className="flex-1 p-4 lg:p-6 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function NotificationBell({ notifications }) {
  const unread = (notifications || []).filter((n) => !n.readAt);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent/50 text-muted focus-visible:outline-2 focus-visible:outline-primary cursor-pointer" aria-label={`Benachrichtigungen${unread.length ? `, ${unread.length} ungelesen` : ""}`}>
          <Bell className="h-4.5 w-4.5" />
          {unread.length > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto sf-scroll">
        <DropdownMenuLabel>Benachrichtigungen</DropdownMenuLabel>
        {notifications.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted text-center">Keine Benachrichtigungen.</p>
        ) : (
          notifications.slice(0, 12).map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link href={n.link || "#"} className={cn("flex flex-col items-start gap-0.5", !n.readAt && "bg-accent/30")}>
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  {!n.readAt ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                  {n.title}
                </span>
                <span className="text-[11px] text-muted line-clamp-2">{n.body}</span>
                <span className="text-[10px] text-muted/70">
                  {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(n.createdAt))}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
