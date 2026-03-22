import React from "react";

type BadgeVariant = "present" | "absent" | "late" | "active" | "inactive" | "info" | "warning";

const variantStyles: Record<BadgeVariant, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  absent: "bg-red-100 text-red-700 border-red-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  info: "bg-cyan-100 text-cyan-700 border-cyan-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

export function StatusBadge({ variant, children, dot = false }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[0.75rem] ${variantStyles[variant]}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "present" || variant === "active"
              ? "bg-emerald-500"
              : variant === "absent"
              ? "bg-red-500"
              : variant === "late" || variant === "warning"
              ? "bg-amber-500"
              : variant === "info"
              ? "bg-cyan-500"
              : "bg-slate-400"
          }`}
        />
      )}
      {children}
    </span>
  );
}
