import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

/* ---------------------------------- Button --------------------------------- */

const buttonVariants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:outline-primary shadow-sm",
  secondary:
    "bg-card text-foreground border border-border hover:bg-accent/50 focus-visible:outline-primary",
  ghost: "text-foreground hover:bg-accent/60 focus-visible:outline-primary",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger",
  accent: "bg-accent text-accent-foreground hover:bg-accent/70 focus-visible:outline-primary",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
  icon: "h-9 w-9 p-0 justify-center",
};

export function Button({ variant = "primary", size = "md", className, asChild, children, ...props }) {
  const Comp = props.href ? "a" : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "whitespace-nowrap cursor-pointer",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("bg-card border border-border rounded-(--radius-card) shadow-(--shadow-card)", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("px-5 pt-4 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-xs text-muted mt-0.5", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/* --------------------------------- Formulare -------------------------------- */

const fieldClasses =
  "w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted/60 " +
  "focus:outline-2 focus:outline-offset-0 focus:outline-primary disabled:opacity-60 aria-[invalid=true]:border-danger";

export function Input({ className, ...props }) {
  return <input className={cn(fieldClasses, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(fieldClasses, "min-h-20 py-2", className)} {...props} />;
}

export function NativeSelect({ className, children, ...props }) {
  return (
    <select className={cn(fieldClasses, "h-9 cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("block text-xs font-medium text-foreground mb-1.5", className)}
      {...props}
    />
  );
}

export function FieldError({ children, className }) {
  if (!children) return null;
  return <p className={cn("text-xs text-danger mt-1", className)}>{children}</p>;
}

export function FieldHint({ children, className }) {
  if (!children) return null;
  return <p className={cn("text-xs text-muted mt-1", className)}>{children}</p>;
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm text-foreground cursor-pointer", className)}>
      <input type="checkbox" className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer" {...props} />
      {label}
    </label>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({ tone = "neutral", className, ...props }) {
  const tones = {
    neutral: "bg-accent/60 text-accent-foreground",
    green: "bg-accent text-accent-foreground",
    amber: "bg-warning-bg text-warning",
    red: "bg-danger-bg text-danger",
    blue: "bg-info-bg text-info",
    gray: "bg-background text-muted border border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Avatar --------------------------------- */

export function Avatar({ name, className, size = "md" }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizes = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold select-none shrink-0",
        sizes[size],
        className
      )}
      title={name}
    >
      {initials}
    </span>
  );
}

/* --------------------------------- Tabellen -------------------------------- */

export function Table({ className, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }) {
  return (
    <th
      className={cn(
        "text-left text-[11px] font-semibold uppercase tracking-wide text-muted px-4 py-2.5 border-b border-border bg-background/60 whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }) {
  return <td className={cn("px-4 py-3 border-b border-border/70 align-middle", className)} {...props} />;
}

export function Tr({ className, ...props }) {
  return <tr className={cn("hover:bg-accent/30 transition-colors", className)} {...props} />;
}

/* ------------------------------- Zustände --------------------------------- */

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      {icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/70 text-primary">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-accent/50", className)} />;
}

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 mb-6", className)}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------ Stat-Karte -------------------------------- */

export function StatCard({ label, value, hint, tone = "neutral", icon }) {
  const tones = { neutral: "", amber: "text-warning", red: "text-danger", green: "text-primary" };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon ? <span className="text-muted">{icon}</span> : null}
      </div>
      <p className={cn("mt-1.5 text-2xl font-semibold tracking-tight", tones[tone])}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
