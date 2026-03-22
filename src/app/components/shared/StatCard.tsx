import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down";
  icon: React.ReactNode;
  iconBg?: string;
}

export function StatCard({ title, value, change, changeType = "up", icon, iconBg = "bg-indigo-100 text-indigo-600" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[0.8125rem] text-slate-500">{title}</p>
          <p className="text-[1.75rem] text-slate-900 tracking-tight" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>{value}</p>
          {change && (
            <div className={`flex items-center gap-1 text-[0.75rem] ${changeType === "up" ? "text-emerald-600" : "text-red-500"}`}>
              {changeType === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
