import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BucketPoint, CategorySlice } from "../../lib/selectors";
import { formatCents, formatCentsCompact } from "../../lib/money";

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg shadow-foreground/5">
      {label && <p className="mb-1 text-[11.5px] font-medium text-foreground-secondary">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-[12.5px] text-foreground-secondary">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">
            {formatCents(Math.round((p.value ?? 0) * 100))}
          </span>
        </p>
      ))}
    </div>
  );
}

export function CashflowChart({ data }: { data: BucketPoint[] }) {
  return (
    <div className="h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fontSize: 11, fill: "var(--color-foreground-muted)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={62}
            tick={{ fontSize: 11, fill: "var(--color-foreground-muted)" }}
            tickFormatter={(v: number) => formatCentsCompact(v * 100)}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-secondary)" }}
            content={<TooltipBox />}
          />
          <Bar dataKey="receitas" fill="var(--color-chart-revenue)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="despesas" fill="var(--color-chart-expense)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const chartData = data.map((d) => ({ ...d, value: d.value / 100 }));
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
