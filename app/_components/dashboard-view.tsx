"use client";

import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	CalendarDays,
	CircleDollarSign,
	Package,
	PackagePlus,
	Ship,
	ShoppingBag,
	TrendingUp,
	Trophy,
	Users,
	X,
} from "lucide-react";
import type {
	DashboardStats,
	Product,
	RevenueTrend,
	TabId,
	TopCustomer,
	TopProduct,
} from "../_lib/types";
import {
	currentMonthName,
	formatNaira,
	formatNumber,
	stockStatus,
} from "../_lib/format";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Meter, StatCard } from "./ui";
import { RevenueChart } from "./revenue-chart";

const greeting = () => {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
};

export function DashboardView({
	userName,
	stats,
	trends,
	topProducts,
	topCustomers,
	products,
	lowStockProducts,
	showLowStockAlert,
	onDismissLowStock,
	onNavigate,
	isAdmin,
	onRestock,
	onRestockAll,
}: {
	userName: string;
	stats: DashboardStats | null;
	trends: RevenueTrend[];
	topProducts: TopProduct[];
	topCustomers: TopCustomer[];
	products: Product[];
	lowStockProducts: Product[];
	showLowStockAlert: boolean;
	onDismissLowStock: () => void;
	onNavigate: (tab: TabId) => void;
	isAdmin: boolean;
	onRestock: (product: Product) => void;
	onRestockAll: () => void;
}) {
	const month = currentMonthName();
	const firstName = userName.split(" ")[0] || "there";
	const yearRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);
	const best = trends.reduce<RevenueTrend | null>(
		(acc, t) => (t.revenue > (acc?.revenue ?? 0) ? t : acc),
		null
	);

	// Products closest to (or furthest below) their reorder level first.
	const inventory = [...products]
		.sort(
			(a, b) =>
				a.currentStock / Math.max(a.reorderLevel, 1) -
				b.currentStock / Math.max(b.reorderLevel, 1)
		)
		.slice(0, 6);

	const maxProductRevenue = Math.max(...topProducts.map((p) => p.totalRevenue), 1);
	const maxCustomerSpend = Math.max(...topCustomers.map((c) => c.totalSpent), 1);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
						{greeting()}, {firstName}
					</h2>
					<p className="mt-1 text-sm text-ink-3">
						Here’s what’s happening across Eadrack Trading today.
					</p>
				</div>
				<Button onClick={() => onNavigate("sales")}>
					<ShoppingBag size={16} />
					Record a sale
				</Button>
			</div>

			{showLowStockAlert && lowStockProducts.length > 0 && (
				<div className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3.5">
					<div className="flex items-start gap-3">
					<AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-ink">
							{lowStockProducts.length} product
							{lowStockProducts.length === 1 ? " needs" : "s need"} restocking
						</p>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{lowStockProducts.slice(0, 6).map((p) => (
								<span
									key={p.id}
									className="max-w-full truncate whitespace-nowrap rounded-md bg-surface/70 px-2 py-0.5 text-xs text-ink-2 ring-1 ring-warning/20"
								>
									{p.name}{" "}
									<span
										className={
											p.currentStock <= 0
												? "font-semibold text-danger"
												: "font-semibold tabular-nums text-ink"
										}
									>
										{p.currentStock <= 0 ? "out of stock" : `${p.currentStock} left`}
									</span>
								</span>
							))}
							{lowStockProducts.length > 6 && (
								<span className="px-1 py-0.5 text-xs text-ink-3">
									+{lowStockProducts.length - 6} more
								</span>
							)}
						</div>
					</div>
						{/* Tablet and up: action beside the text */}
						<div className="shrink-0 max-sm:hidden">
							{isAdmin ? (
								<Button size="sm" onClick={onRestockAll}>
									<Ship size={14} />
									Restock all
								</Button>
							) : (
								<Button variant="ghost" size="sm" onClick={() => onNavigate("products")}>
									Review stock <ArrowRight size={14} />
								</Button>
							)}
						</div>
						<button
							type="button"
							onClick={onDismissLowStock}
							aria-label="Dismiss low stock alert"
							className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-ink-3 hover:bg-surface/60 hover:text-ink cursor-pointer"
						>
							<X size={16} />
						</button>
					</div>
					{/* Phones: full-width action under the text */}
					<div className="mt-3 sm:hidden">
						{isAdmin ? (
							<Button size="sm" onClick={onRestockAll} className="w-full">
								<Ship size={14} />
								Restock all
							</Button>
						) : (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => onNavigate("products")}
								className="w-full"
							>
								Review stock <ArrowRight size={14} />
							</Button>
						)}
					</div>
				</div>
			)}

			{/* KPIs */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total revenue"
					value={formatNaira(stats?.totalRevenue)}
					hint="All time, across every sale"
					icon={<CircleDollarSign size={17} />}
				/>
				<StatCard
					label={`${month} revenue`}
					value={formatNaira(stats?.monthRevenue)}
					hint={
						<>
							Today:{" "}
							<span className="font-medium text-ink-2 tabular-nums">
								{formatNaira(stats?.todayRevenue)}
							</span>
						</>
					}
					icon={<CalendarDays size={17} />}
				/>
				<StatCard
					label="Units sold"
					value={formatNumber(stats?.totalUnitsSold)}
					hint={
						<>
							<span className="tabular-nums">{formatNumber(stats?.monthUnits)}</span>{" "}
							this month
						</>
					}
					icon={<Boxes size={17} />}
				/>
				<StatCard
					label="Customers"
					value={formatNumber(stats?.totalCustomers)}
					hint={
						<>
							<span className="tabular-nums">
								{formatNumber(stats?.totalProducts ?? products.length)}
							</span>{" "}
							products in catalogue
						</>
					}
					icon={<Users size={17} />}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				{/* Revenue chart */}
				<Card className="xl:col-span-2">
					<CardHeader
						icon={<TrendingUp size={16} />}
						title="Revenue by month"
						description={
							best ? (
								<>
									<span className="tabular-nums">{formatNaira(yearRevenue)}</span>{" "}
									this year · best month{" "}
									<span className="font-medium text-ink-2">{best.month}</span>
								</>
							) : (
								"No sales recorded yet this year"
							)
						}
					/>
					<div className="px-5 pb-5 pt-9">
						<RevenueChart trends={trends} />
					</div>
				</Card>

				{/* Inventory health */}
				<Card>
					<CardHeader
						icon={<Package size={16} />}
						title="Inventory health"
						description="Products closest to running out"
						action={
							<Button variant="ghost" size="sm" onClick={() => onNavigate("products")}>
								View all
							</Button>
						}
					/>
					{inventory.length === 0 ? (
						<EmptyState
							icon={<Package size={20} />}
							title="No products yet"
							description="Add products to start tracking stock."
						/>
					) : (
						<ul className="space-y-4 px-5 pb-5 pt-5">
							{inventory.map((p) => {
								const status = stockStatus(p);
								const remaining =
									(p.currentStock / Math.max(p.initialStock, 1)) * 100;
								return (
									<li key={p.id}>
										<div className="flex items-center justify-between gap-3">
											<p className="truncate text-sm font-medium text-ink">
												{p.name}
											</p>
											{status !== "ok" ? (
												<div className="flex shrink-0 items-center gap-1.5">
													{status === "out" ? (
														<Badge tone="danger">Out of stock</Badge>
													) : (
														<Badge tone="warning">Low stock</Badge>
													)}
													{isAdmin && (
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => onRestock(p)}
															aria-label={`Restock ${p.name}`}
															title="Restock"
														>
															<PackagePlus size={15} />
														</Button>
													)}
												</div>
											) : (
												<span className="text-xs tabular-nums text-ink-3">
													{Math.round(remaining)}% left
												</span>
											)}
										</div>
										<div className="mt-2 flex items-center gap-3">
											<Meter
												value={remaining}
												tone={
													status === "out"
														? "danger"
														: status === "low"
														? "warning"
														: "accent"
												}
												label={`${p.name} stock remaining`}
											/>
											<span className="w-20 shrink-0 text-right text-xs tabular-nums text-ink-3">
												{formatNumber(p.currentStock)} / {formatNumber(p.initialStock)}
											</span>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Top products */}
				<Card>
					<CardHeader
						icon={<Trophy size={16} />}
						title="Top products"
						description="Ranked by revenue"
					/>
					{topProducts.length === 0 ? (
						<EmptyState
							icon={<Trophy size={20} />}
							title="No sales yet"
							description="Your best-selling products will show up here."
						/>
					) : (
						<ol className="space-y-1 p-3 pt-4">
							{topProducts.map((item, index) => (
								<li
									key={item.product.id}
									className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-subtle/60"
								>
									<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-subtle text-xs font-semibold text-ink-2 tabular-nums">
										{index + 1}
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline justify-between gap-3">
											<p className="truncate text-sm font-medium text-ink">
												{item.product.name}
											</p>
											<p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
												{formatNaira(item.totalRevenue)}
											</p>
										</div>
										<div className="mt-1.5 flex items-center gap-3">
											<Meter value={(item.totalRevenue / maxProductRevenue) * 100} />
											<span className="w-20 shrink-0 text-right text-xs text-ink-3 tabular-nums">
												{formatNumber(item.totalSold)} units
											</span>
										</div>
									</div>
								</li>
							))}
						</ol>
					)}
				</Card>

				{/* Top customers */}
				<Card>
					<CardHeader
						icon={<Users size={16} />}
						title="Top customers"
						description="Ranked by lifetime spend"
						action={
							<Button variant="ghost" size="sm" onClick={() => onNavigate("customers")}>
								View all
							</Button>
						}
					/>
					{topCustomers.length === 0 ? (
						<EmptyState
							icon={<Users size={20} />}
							title="No customer spend yet"
							description="Customers who buy the most will appear here."
						/>
					) : (
						<ol className="space-y-1 p-3 pt-4">
							{topCustomers.map((item) => (
								<li
									key={item.customer.id}
									className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-subtle/60"
								>
									<Avatar name={item.customer.name} />
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline justify-between gap-3">
											<p className="truncate text-sm font-medium text-ink">
												{item.customer.name}
											</p>
											<p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
												{formatNaira(item.totalSpent)}
											</p>
										</div>
										<div className="mt-1.5 flex items-center gap-3">
											<Meter value={(item.totalSpent / maxCustomerSpend) * 100} />
											<span className="w-20 shrink-0 text-right text-xs text-ink-3 tabular-nums">
												{formatNumber(item.totalPurchases ?? 0)} orders
											</span>
										</div>
									</div>
								</li>
							))}
						</ol>
					)}
				</Card>
			</div>
		</div>
	);
}
