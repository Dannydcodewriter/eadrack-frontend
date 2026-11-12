"use client";

import { useState } from "react";
import type { RevenueTrend } from "../_lib/types";
import { MONTHS } from "../_lib/types";
import {
	cn,
	currentMonthName,
	formatNaira,
	formatNairaCompact,
	formatNumber,
} from "../_lib/format";

const niceStep = (max: number, count: number) => {
	if (max <= 0) return 1;
	const raw = max / count;
	const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
	const n = raw / magnitude;
	const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
	return step * magnitude;
};

/**
 * Single-series monthly revenue column chart.
 * One hue (accent), columns ≤24px with 4px rounded caps on a shared
 * baseline, hairline gridlines, and a hover/focus tooltip per month.
 */
export function RevenueChart({ trends }: { trends: RevenueTrend[] }) {
	const [active, setActive] = useState<number | null>(null);
	const thisMonth = currentMonthName();

	// Always show all 12 months, even when the API returns nothing.
	const data = MONTHS.map(
		(month) =>
			trends.find((t) => t.month === month) ?? {
				month,
				revenue: 0,
				quantity: 0,
				salesCount: 0,
			}
	);

	const max = Math.max(...data.map((d) => d.revenue), 0);
	const step = niceStep(max, 4);
	const top = max > 0 ? Math.ceil(max / step) * step : 4;
	const ticks: number[] = [];
	for (let v = 0; v <= top + step / 2; v += max > 0 ? step : 1) ticks.push(v);

	return (
		<div className="select-none">
			<div className="flex gap-3">
				{/* Y axis */}
				<div className="relative h-56 w-10 shrink-0 text-right sm:w-12">
					{ticks.map((t) => (
						<span
							key={t}
							className="absolute right-0 -translate-y-1/2 text-[11px] tabular-nums text-ink-3"
							style={{ bottom: `${(t / top) * 100}%` }}
						>
							{max > 0 ? formatNairaCompact(t) : t === 0 ? "₦0" : ""}
						</span>
					))}
				</div>

				{/* Plot */}
				<div className="relative h-56 flex-1">
					{ticks.map((t) => (
						<div
							key={t}
							aria-hidden
							className={cn(
								"absolute inset-x-0 h-px",
								t === 0 ? "bg-line-strong" : "bg-line"
							)}
							style={{ bottom: `${(t / top) * 100}%` }}
						/>
					))}

					<div
						className="absolute inset-0 flex items-end"
						onMouseLeave={() => setActive(null)}
					>
						{data.map((d, i) => {
							const pct = top > 0 ? (d.revenue / top) * 100 : 0;
							const isActive = active === i;
							const dimmed = active !== null && !isActive;
							const align =
								i < 2 ? "left-0" : i > 9 ? "right-0" : "left-1/2 -translate-x-1/2";
							return (
								<div
									key={d.month}
									tabIndex={0}
									role="img"
									aria-label={`${d.month}: ${formatNaira(d.revenue)} revenue, ${formatNumber(d.quantity ?? 0)} units`}
									onMouseEnter={() => setActive(i)}
									onFocus={() => setActive(i)}
									onBlur={() => setActive(null)}
									className="relative flex h-full flex-1 items-end justify-center outline-none focus-visible:bg-subtle/70 rounded-md"
								>
									<div
										className={cn(
											"w-3/5 max-w-6 rounded-t-[4px] bg-accent transition-[height,opacity] duration-500",
											dimmed && "opacity-40"
										)}
										style={{
											height: d.revenue > 0 ? `max(${pct}%, 3px)` : "0%",
										}}
									/>

									{isActive && (
										<div
											className={cn(
												"pointer-events-none absolute z-10 w-max min-w-36 rounded-lg border border-line bg-surface px-3 py-2 shadow-pop animate-fade-in",
												align
											)}
											style={{ bottom: `calc(${pct}% + 10px)` }}
										>
											<p className="text-xs font-medium text-ink-3">{d.month}</p>
											<p className="mt-0.5 text-sm font-semibold text-ink tabular-nums">
												{formatNaira(d.revenue)}
											</p>
											<p className="mt-0.5 text-xs text-ink-3 tabular-nums">
												{formatNumber(d.quantity ?? 0)} units ·{" "}
												{formatNumber(d.salesCount ?? 0)} sales
											</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* X axis */}
			<div className="ml-13 mt-2 flex sm:ml-15">
				{data.map((d) => (
					<span
						key={d.month}
						className={cn(
							"flex-1 text-center text-[11px]",
							d.month === thisMonth ? "font-semibold text-ink" : "text-ink-3"
						)}
					>
						<span className="sm:hidden" aria-hidden>
							{d.month.slice(0, 1)}
						</span>
						<span className="max-sm:hidden">{d.month.slice(0, 3)}</span>
					</span>
				))}
			</div>
		</div>
	);
}
