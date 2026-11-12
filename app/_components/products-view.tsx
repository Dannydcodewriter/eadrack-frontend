"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Package, PackagePlus, Plus, Ship, Trash2 } from "lucide-react";
import type { Product } from "../_lib/types";
import {
	cn,
	formatNaira,
	formatNairaCompact,
	formatNumber,
	percentSold,
	stockStatus,
} from "../_lib/format";
import {
	Button,
	Card,
	CardHeader,
	EmptyState,
	Field,
	Input,
	Meter,
	PAGE_SIZE,
	SearchInput,
	Select,
	ShowMore,
	tableClasses as t,
} from "./ui";
import { StatusBadge } from "./restock-modals";

export interface NewProductForm {
	name: string;
	initialStock: string;
	price: string;
	category: string;
	reorderLevel: string;
}

type StockFilter = "all" | "restock" | "low" | "out";

export function ProductsView({
	products,
	isAdmin,
	newProduct,
	onNewProductChange,
	onAddProduct,
	onDeleteProduct,
	onRestock,
	onReceiveShipment,
	submitting,
}: {
	products: Product[];
	isAdmin: boolean;
	newProduct: NewProductForm;
	onNewProductChange: (form: NewProductForm) => void;
	onAddProduct: () => void;
	onDeleteProduct: (product: Product) => void;
	onRestock: (product: Product) => void;
	onReceiveShipment: () => void;
	submitting: boolean;
}) {
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("All");
	const [stockFilter, setStockFilterState] = useState<StockFilter>("all");
	const [limit, setLimit] = useState(PAGE_SIZE);
	const setStockFilter = (value: StockFilter) => {
		setStockFilterState(value);
		setLimit(PAGE_SIZE);
	};

	const categories = useMemo(
		() =>
			Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
		[products]
	);

	const counts = useMemo(
		() => ({
			low: products.filter((p) => stockStatus(p) === "low").length,
			out: products.filter((p) => stockStatus(p) === "out").length,
			value: products.reduce((sum, p) => sum + p.currentStock * p.price, 0),
		}),
		[products]
	);
	const needsRestock = counts.low + counts.out;

	const filtered = products
		.filter((p) => {
			const term = search.trim().toLowerCase();
			if (term && !p.name.toLowerCase().includes(term) && !p.category?.toLowerCase().includes(term))
				return false;
			if (category !== "All" && p.category !== category) return false;
			const status = stockStatus(p);
			if (stockFilter === "restock" && status === "ok") return false;
			if ((stockFilter === "low" || stockFilter === "out") && status !== stockFilter) return false;
			return true;
		})
		// In the "needs restock" view, the emptiest shelves come first.
		.sort((a, b) =>
			stockFilter === "restock"
				? a.currentStock / Math.max(a.reorderLevel, 1) - b.currentStock / Math.max(b.reorderLevel, 1)
				: 0
		);

	const visible = filtered.slice(0, limit);

	const canSubmit =
		!!newProduct.name &&
		!!newProduct.category &&
		!!newProduct.initialStock &&
		!!newProduct.price;

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (canSubmit && !submitting) onAddProduct();
	};

	const set = (key: keyof NewProductForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
		onNewProductChange({ ...newProduct, [key]: e.target.value });

	const filterChip = (value: StockFilter, label: string, count?: number) => (
		<button
			type="button"
			onClick={() => setStockFilter(value)}
			aria-pressed={stockFilter === value}
			className={cn(
				"inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors cursor-pointer",
				stockFilter === value
					? "bg-ink text-canvas"
					: "text-ink-2 hover:bg-subtle hover:text-ink"
			)}
		>
			{label}
			{count !== undefined && (
				<span
					className={cn(
						"tabular-nums text-xs",
						stockFilter === value ? "opacity-70" : "text-ink-3"
					)}
				>
					{count}
				</span>
			)}
		</button>
	);

	return (
		<div className="space-y-6">
			{/* Restock call-to-action */}
			{(needsRestock > 0 || isAdmin) && (
				<div
					className={cn(
						"flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
						needsRestock > 0
							? "border-warning/30 bg-warning-soft"
							: "border-line bg-surface shadow-card"
					)}
				>
					<div className="flex items-start gap-3">
						{needsRestock > 0 ? (
							<AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
						) : (
							<Ship size={18} className="mt-0.5 shrink-0 text-ink-3" />
						)}
						<div>
							<p className="text-sm font-semibold text-ink">
								{needsRestock > 0
									? `${needsRestock} product${needsRestock === 1 ? " needs" : "s need"} restocking`
									: "All products are above their reorder level"}
							</p>
							<p className="mt-0.5 text-[13px] text-ink-2">
								{needsRestock > 0 ? (
									<>
										{counts.out > 0 && `${counts.out} out of stock`}
										{counts.out > 0 && counts.low > 0 && " · "}
										{counts.low > 0 && `${counts.low} running low`}
										{needsRestock > 0 && stockFilter !== "restock" && (
											<>
												{" · "}
												<button
													type="button"
													onClick={() => setStockFilter("restock")}
													className="font-medium text-ink underline underline-offset-2 hover:no-underline cursor-pointer"
												>
													Show them
												</button>
											</>
										)}
									</>
								) : (
									"When a shipment arrives, record everything it contained in one go."
								)}
							</p>
						</div>
					</div>
					{isAdmin && (
						<Button onClick={onReceiveShipment} className="shrink-0">
							<Ship size={16} />
							Receive shipment
						</Button>
					)}
				</div>
			)}

			{/* Summary */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{[
					{ label: "Products", value: formatNumber(products.length) },
					{
						label: "Stock value",
						value: formatNaira(counts.value),
						compact: formatNairaCompact(counts.value),
					},
					{ label: "Low stock", value: formatNumber(counts.low), tone: counts.low ? "text-warning" : "" },
					{ label: "Out of stock", value: formatNumber(counts.out), tone: counts.out ? "text-danger" : "" },
				].map((s) => (
					<Card key={s.label} className="min-w-0 px-4 py-4 sm:px-5" title={s.compact ? s.value : undefined}>
						<p className="text-xs font-medium text-ink-3">{s.label}</p>
						<p className={cn("mt-1.5 truncate text-lg font-semibold tracking-tight tabular-nums text-ink sm:text-xl", s.tone)}>
							{s.compact ? (
								<>
									<span className="xl:hidden">{s.compact}</span>
									<span className="max-xl:hidden">{s.value}</span>
								</>
							) : (
								s.value
							)}
						</p>
					</Card>
				))}
			</div>

			{isAdmin && (
				<Card>
					<CardHeader
						icon={<Plus size={16} />}
						title="Add a new product"
						description="For products you’ve never stocked before. To refill an existing product, use Restock."
					/>
					<form onSubmit={submit} className="p-5">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr]">
							<Field label="Product name" required>
								{(id) => (
									<Input id={id} placeholder="e.g. SCD1324 Brake Pad" value={newProduct.name} onChange={set("name")} />
								)}
							</Field>
							<Field label="Category" required>
								{(id) => (
									<>
										<Input
											id={id}
											list="product-categories"
											placeholder="e.g. Brake Pad"
											value={newProduct.category}
											onChange={set("category")}
										/>
										<datalist id="product-categories">
											{categories.map((c) => (
												<option key={c} value={c} />
											))}
										</datalist>
									</>
								)}
							</Field>
							<Field label="Initial stock" required>
								{(id) => (
									<Input id={id} type="number" inputMode="numeric" min={0} placeholder="0" className="tabular-nums" value={newProduct.initialStock} onChange={set("initialStock")} />
								)}
							</Field>
							<Field label="Unit price (₦)" required>
								{(id) => (
									<Input id={id} type="number" inputMode="decimal" min={0} step="0.01" placeholder="0.00" className="tabular-nums" value={newProduct.price} onChange={set("price")} />
								)}
							</Field>
							<Field label="Reorder level">
								{(id) => (
									<Input id={id} type="number" inputMode="numeric" min={0} placeholder="10" className="tabular-nums" value={newProduct.reorderLevel} onChange={set("reorderLevel")} />
								)}
							</Field>
						</div>
						<div className="mt-5 flex items-center justify-between gap-4">
							<p className="text-xs text-ink-3">
								You’ll get a low-stock alert when stock falls to the reorder level.
							</p>
							<Button type="submit" disabled={!canSubmit} loading={submitting}>
								{!submitting && <Plus size={16} />}
								Add product
							</Button>
						</div>
					</form>
				</Card>
			)}

			<Card className="overflow-hidden">
				<div className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
					<div className="-mx-1 flex flex-wrap items-center gap-1">
						{filterChip("all", "All", products.length)}
						{filterChip("restock", "Needs restock", needsRestock)}
						{filterChip("low", "Low", counts.low)}
						{filterChip("out", "Out", counts.out)}
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<SearchInput
							value={search}
							onChange={(v) => {
								setSearch(v);
								setLimit(PAGE_SIZE);
							}}
							placeholder="Search products"
							className="sm:flex-1 lg:w-64 lg:flex-none"
						/>
						<div className="sm:w-44">
							<Select
								aria-label="Filter by category"
								value={category}
								onChange={(e) => {
									setCategory(e.target.value);
									setLimit(PAGE_SIZE);
								}}
								className="h-9!"
							>
								<option value="All">All categories</option>
								{categories.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</Select>
						</div>
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="border-t border-line">
						<EmptyState
							icon={<Package size={20} />}
							title={
								stockFilter === "restock" && products.length
									? "Nothing needs restocking"
									: products.length
									? "No matching products"
									: "No products yet"
							}
							description={
								stockFilter === "restock" && products.length
									? "Every product is above its reorder level."
									: products.length
									? "Try clearing your search or filters."
									: isAdmin
									? "Add your first product using the form above."
									: "An administrator hasn’t added any products yet."
							}
						/>
					</div>
				) : (
					<>
						{/* Phones: compact cards */}
						<ul className="divide-y divide-line border-t border-line md:hidden">
							{visible.map((product) => {
								const status = stockStatus(product);
								const remaining = 100 - percentSold(product);
								return (
									<li key={product.id} className="px-4 py-3.5">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-ink">{product.name}</p>
												<p className="truncate text-xs text-ink-3">
													{product.category}
													{product.supplier && ` · ${product.supplier}`}
												</p>
											</div>
											<StatusBadge status={status} />
										</div>
										<div className="mt-2.5 flex items-center gap-3">
											<Meter
												value={remaining}
												tone={status === "out" ? "danger" : status === "low" ? "warning" : "accent"}
												label={`${product.name} stock remaining`}
											/>
											<span className="shrink-0 text-xs tabular-nums">
												<span className="font-medium text-ink">{formatNumber(product.currentStock)}</span>
												<span className="text-ink-3"> / {formatNumber(product.initialStock)}</span>
											</span>
										</div>
										<div className="mt-2.5 flex items-center justify-between gap-3">
											<p className="text-xs text-ink-3 tabular-nums">
												<span className="text-sm font-semibold text-ink">{formatNaira(product.price)}</span>
												{" · "}
												{formatNumber(product.initialStock - product.currentStock)} sold
											</p>
											{isAdmin && (
												<div className="flex shrink-0 items-center gap-1">
													<Button
														variant="ghost-danger"
														size="icon-sm"
														onClick={() => onDeleteProduct(product)}
														aria-label={`Delete ${product.name}`}
													>
														<Trash2 size={15} />
													</Button>
													<Button
														variant={status === "ok" ? "secondary" : "primary"}
														size="sm"
														onClick={() => onRestock(product)}
														aria-label={`Restock ${product.name}`}
													>
														<PackagePlus size={14} />
														Restock
													</Button>
												</div>
											)}
										</div>
									</li>
								);
							})}
						</ul>

						{/* Tablet and up: full table */}
						<div className={cn(t.wrap, "max-md:hidden")}>
							<table className={t.table}>
								<thead>
									<tr>
										<th className={t.th}>Product</th>
										<th className={t.th}>Status</th>
										<th className={cn(t.th, "min-w-44")} title="Units on hand / total units ever received">
											On hand / received
										</th>
										<th className={cn(t.th, "text-right")}>Unit price</th>
										<th className={cn(t.th, "text-right max-xl:hidden")}>Sold</th>
										{isAdmin && (
											<th className={t.th}>
												<span className="sr-only">Actions</span>
											</th>
										)}
									</tr>
								</thead>
								<tbody>
									{visible.map((product) => {
										const status = stockStatus(product);
										const sold = product.initialStock - product.currentStock;
										const pctSold = percentSold(product);
										const remaining = 100 - pctSold;
										return (
											<tr key={product.id} className={cn(t.tr, "group")}>
												<td className={t.td}>
													<p className="font-medium text-ink">{product.name}</p>
													<p className="text-xs text-ink-3">
														{product.category}
														{product.supplier && ` · ${product.supplier}`}
													</p>
												</td>
												<td className={t.td}>
													<StatusBadge status={status} />
												</td>
												<td className={t.td}>
													<div className="flex items-center gap-3">
														<Meter
															value={remaining}
															tone={status === "out" ? "danger" : status === "low" ? "warning" : "accent"}
															label={`${product.name} stock remaining`}
															className="max-w-32"
														/>
														<span className="whitespace-nowrap text-xs tabular-nums">
															<span className="font-medium text-ink">{formatNumber(product.currentStock)}</span>
															<span className="text-ink-3"> / {formatNumber(product.initialStock)}</span>
														</span>
													</div>
												</td>
												<td className={cn(t.td, "text-right tabular-nums whitespace-nowrap text-ink")}>
													{formatNaira(product.price)}
												</td>
												<td className={cn(t.td, "text-right tabular-nums whitespace-nowrap max-xl:hidden")}>
													<span className="text-ink">{formatNumber(sold)}</span>
													<span className="ml-1.5 text-xs text-ink-3">{pctSold.toFixed(0)}%</span>
												</td>
												{isAdmin && (
													<td className={cn(t.td, "text-right")}>
														<div className="flex items-center justify-end gap-1">
															<Button
																variant={status === "ok" ? "secondary" : "primary"}
																size="sm"
																onClick={() => onRestock(product)}
																aria-label={`Restock ${product.name}`}
															>
																<PackagePlus size={14} />
																<span className="max-xl:sr-only">Restock</span>
															</Button>
															<Button
																variant="ghost-danger"
																size="icon-sm"
																onClick={() => onDeleteProduct(product)}
																aria-label={`Delete ${product.name}`}
																title="Delete product"
																className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100"
															>
																<Trash2 size={15} />
															</Button>
														</div>
													</td>
												)}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<ShowMore
							shown={visible.length}
							total={filtered.length}
							noun="products"
							onMore={() => setLimit((l) => l + PAGE_SIZE)}
							onAll={() => setLimit(filtered.length)}
						/>
					</>
				)}
			</Card>
		</div>
	);
}
