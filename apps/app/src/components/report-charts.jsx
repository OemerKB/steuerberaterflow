"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";

const PRIMARY = "#176B4D";
const COLORS = ["#176B4D", "#5FA97F", "#DCEBDD", "#667069", "#D97706", "#C2413B"];

export function MonthlyChart({ data }) {
  return (
    <div className="h-56" role="img" aria-label="Balkendiagramm Einnahmen und Ausgaben">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E7E3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#667069" }} axisLine={{ stroke: "#E2E7E3" }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#667069" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="einnahmen" name="Einnahmen" fill={PRIMARY} radius={[3, 3, 0, 0]} />
          <Bar dataKey="ausgaben" name="Ausgaben" fill="#C9D8CC" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostBreakdownChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-xs text-muted text-center py-10">Keine Daten.</p>;
  }
  return (
    <div className="h-56" role="img" aria-label="Kreisdiagramm Kostenkategorien">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
