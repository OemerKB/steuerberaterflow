"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { X, ChevronDown } from "lucide-react";
import { cn } from "./primitives.jsx";

/* --------------------------------- Dialog ---------------------------------- */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, title, description, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "bg-card border border-border rounded-(--radius-card) shadow-(--shadow-pop) p-5 max-h-[85vh] overflow-y-auto",
          className
        )}
        {...props}
      >
        {title ? (
          <DialogPrimitive.Title className="text-base font-semibold text-foreground">
            {title}
          </DialogPrimitive.Title>
        ) : null}
        {description ? (
          <DialogPrimitive.Description className="mt-1 text-sm text-muted">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className={cn(title || description ? "mt-4" : "")}>{children}</div>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-md p-1 text-muted hover:bg-accent/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ------------------------------ Dropdown-Menu ------------------------------ */

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, align = "end", sideOffset = 4, children, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-44 rounded-lg border border-border bg-card p-1 shadow-(--shadow-pop)",
          className
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground",
        "outline-none focus:bg-accent/60 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />;
}

export function DropdownMenuLabel({ children }) {
  return <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{children}</div>;
}

/* ---------------------------------- Tabs ----------------------------------- */

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn("flex flex-wrap items-center gap-1 border-b border-border", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted",
        "hover:text-foreground hover:border-border transition-colors cursor-pointer",
        "data-[state=active]:border-primary data-[state=active]:text-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-t-md",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn("pt-5 focus-visible:outline-none", className)} {...props} />;
}

/* --------------------------------- Tooltip --------------------------------- */

export function TooltipProvider({ children }) {
  return <TooltipPrimitive.Provider delayDuration={200}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ children, content }) {
  if (!content) return children;
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={4}
          className="z-50 rounded-md bg-foreground px-2 py-1 text-xs text-white shadow-md"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ------------------------------ Mobile-Nav-Toggle --------------------------- */

export function NavToggle({ open, onClick }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? "Navigation schließen" : "Navigation öffnen"}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 lg:hidden cursor-pointer"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
      </svg>
    </button>
  );
}

export { ChevronDown };
