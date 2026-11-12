"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Plus, Receipt, Trash2, UserPlus } from "lucide-react";
import { Combobox, type ComboboxOption } from "./combobox";
import type { Customer, Product, Sale } from "../_lib/types";
import { MONTHS } from "../_lib/types";
import { cn, formatDate, formatNaira, formatNumber } from "../_lib/format";
import {
	Avatar,
	Button,
	Card,
	CardHeader,
	EmptyState,
	Field,
	Input,
	PAGE_SIZE,
	SearchInput,
	Select,
	ShowMore,
	tableClasses as t,
} from "./ui";

export interface NewSaleForm {
	productId: string;
	customerId: string;
	quantity: string;
	month: string;
}

export function SalesView({
	sales,
	products,
	customers,
	isAdmin,
	newSale,
	onNewSaleChange,
	onAddSale,
	onDeleteSale,
	submitting,
	selectedMonth,
	onSelectedMonthChange,
	onGoToCustomers,
}: {
	sales: Sale[];
	products: Product[];
	customers: Customer[];
	isAdmin: boolean;
	newSale: NewSaleForm;
	onNewSaleChange: (form: NewSaleForm) => void;
	onAddSale: () => void;
	onDeleteSale: (sale: Sale) => void;
	submitting: boolean;
	selectedMonth: string;
	onSelectedMonthChange: (month: string) => void;
	onGoToCustomers: () => void;
}) {
	const [search, setSearch] = useState("");
	const [limit, setLimit] = useState(PAGE_SIZE);

	const productOptions = useMemo<ComboboxOption[]>(
		() =>
			[...products]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((p) => ({
					value: p.id,
					label: p.name,
					hint: p.currentStock > 0 ? `${formatNumber(p.currentStock)} in stock` : "Out of stock",
					disabled: p.currentStock <= 0,
				})),
		[products]
	);

	const customerOptions = useMemo<ComboboxOption[]>(
		() =>
			[...customers]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((c) => ({
					value: c.id,
					label: c.name,
					// Skip placeholder phones like "N/A" or "-".
					hint: /\d/.test(c.phone ?? "") ? c.phone : undefined,
				})),
		[customers]
	);

	const product = products.find((p) => p.id === newSale.productId);
	const qty = parseInt(newSale.quantity) || 0;
	const estimatedTotal = product ? product.price * qty : 0;
	const overStock = !!product && qty > product.currentStock;
	const canSubmit =
		!!newSale.productId &&
		!!newSale.customerId &&
		qty > 0 &&
		!!newSale.month &&
		!overStock;

	const filtered = useMemo(() => {
		const validMonths: readonly string[] = MONTHS;
		const byMonth =
			selectedMonth === "All"
				? sales.filter((s) => validMonths.includes(s.month))
				: sales.filter((s) => s.month === selectedMonth);
		const term = search.trim().toLowerCase();
		const bySearch = term
			? byMonth.filter(
					(s) =>
						s.product?.name?.toLowerCase().includes(term) ||
						s.customer?.name?.toLowerCase().includes(term)
			  )
			: byMonth;
		return [...bySearch].sort(
			(a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
		);
	}, [sales, selectedMonth, search]);

	const totals = filtered.reduce(
		(acc, s) => ({
			revenue: acc.revenue + s.totalPrice,
			units: acc.units + s.quantity,
		}),
		{ revenue: 0, units: 0 }
	);

	const showMonthCol = selectedMonth === "All";
	const visible = filtered.slice(0, limit);

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (canSubmit && !submitting) onAddSale();
	};

	return (
		<div className="space-y-6">
			{/* Record sale */}
			<Card>
				<CardHeader
					icon={<Plus size={16} />}
					title="Record a sale"
					description="Stock is deducted automatically once the sale is saved."
				/>
				<form onSubmit={submit} className="p-5">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1.4fr_1.4fr_0.8fr]">
						<Field label="Month" required>
							{(id) => (
								<Select
									id={id}
									value={newSale.month}
									onChange={(e) =>
										onNewSaleChange({ ...newSale, month: e.target.value })
									}
								>
									{MONTHS.map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</Select>
							)}
						</Field>
						<Field label="Product" required>
							{(id) => (
								<Combobox
									id={id}
									value={newSale.productId}
									onChange={(productId) => onNewSaleChange({ ...newSale, productId })}
									options={productOptions}
									placeholder="Select a product"
									searchPlaceholder="Search products…"
									noun="products"
									emptyText={
										products.length ? "No product matches your search" : "No products yet"
									}
								/>
							)}
						</Field>
						<Field label="Customer" required>
							{(id) => (
								<Combobox
									id={id}
									value={newSale.customerId}
									onChange={(customerId) => onNewSaleChange({ ...newSale, customerId })}
									options={customerOptions}
									placeholder="Select a customer"
									searchPlaceholder="Search name or phone…"
									noun="customers"
									emptyText={
										customers.length
											? "No customer matches your search"
											: "No customers yet"
									}
									footerAction={{
										label: "Add new customer",
										icon: <UserPlus size={13} />,
										onSelect: onGoToCustomers,
									}}
								/>
							)}
						</Field>
						<Field label="Quantity" required>
							{(id) => (
								<Input
									id={id}
									type="number"
									inputMode="numeric"
									min={1}
									placeholder="0"
									value={newSale.quantity}
									aria-invalid={overStock || undefined}
									className={cn(
										"tabular-nums",
										overStock && "border-danger focus:border-danger focus:ring-danger/15"
									)}
									onChange={(e) =>
										onNewSaleChange({ ...newSale, quantity: e.target.value })
									}
								/>
							)}
						</Field>
					</div>

					<div className="mt-5 flex flex-col gap-4 rounded-xl bg-subtle/70 p-4 sm:flex-row sm:items-center sm:justify-between">
						<dl className="grid grid-cols-3 gap-4 sm:flex sm:gap-8">
							<div>
								<dt className="text-xs text-ink-3">Unit price</dt>
								<dd className="mt-0.5 text-sm font-medium text-ink tabular-nums">
									{product ? formatNaira(product.price) : "—"}
								</dd>
							</div>
							<div>
								<dt className="text-xs text-ink-3">Stock after sale</dt>
								<dd
									className={cn(
										"mt-0.5 text-sm font-medium tabular-nums",
										overStock ? "text-danger" : "text-ink"
									)}
								>
									{product ? formatNumber(product.currentStock - qty) : "—"}
								</dd>
							</div>
							<div>
								<dt className="text-xs text-ink-3">Sale total</dt>
								<dd className="mt-0.5 text-base font-semibold text-ink tabular-nums">
									{formatNaira(estimatedTotal)}
								</dd>
							</div>
						</dl>
						<div className="flex flex-col items-stretch gap-2 sm:items-end">
							{overStock && (
								<p className="flex items-center gap-1.5 text-xs font-medium text-danger">
									<AlertTriangle size={14} />
									Only {product?.currentStock} in stock
								</p>
							)}
							<Button type="submit" disabled={!canSubmit} loading={submitting}>
								{!submitting && <Plus size={16} />}
								Record sale
							</Button>
						</div>
					</div>
				</form>
			</Card>

			{/* Sales history */}
			<Card className="overflow-hidden">
				<div className="flex flex-col gap-3 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
					<div>
						<h3 className="text-[15px] font-semibold tracking-tight text-ink">
							Sales history
						</h3>
						<p className="mt-0.5 text-[13px] text-ink-3 tabular-nums">
							{formatNumber(filtered.length)} sale{filtered.length === 1 ? "" : "s"} ·{" "}
							{formatNumber(totals.units)} units ·{" "}
							<span className="font-medium text-ink-2">{formatNaira(totals.revenue)}</span>
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<SearchInput
							value={search}
							onChange={(v) => {
								setSearch(v);
								setLimit(PAGE_SIZE);
							}}
							placeholder="Search product or customer"
							className="sm:w-64"
						/>
						<div className="sm:w-44">
							<Select
								aria-label="Filter by month"
								value={selectedMonth}
								onChange={(e) => {
									onSelectedMonthChange(e.target.value);
									setLimit(PAGE_SIZE);
								}}
								className="h-9!"
							>
								<option value="All">All months</option>
								{MONTHS.map((m) => (
									<option key={m} value={m}>
										{m}
									</option>
								))}
							</Select>
						</div>
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="border-t border-line">
						<EmptyState
							icon={<Receipt size={20} />}
							title={search ? "No matching sales" : "No sales yet"}
							description={
								search
									? "Try a different product or customer name."
									: selectedMonth === "All"
									? "Recorded sales will appear here."
									: `Nothing recorded for ${selectedMonth} yet.`
							}
						/>
					</div>
				) : (
					<>
						{/* Phones: compact cards */}
						<ul className="divide-y divide-line border-t border-line md:hidden">
							{visible.map((sale) => (
								<li key={sale.id} className="flex items-start gap-3 px-4 py-3">
									<Avatar name={sale.customer?.name || "?"} size="sm" className="mt-0.5" />
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline justify-between gap-3">
											<p className="truncate text-sm font-medium text-ink">
												{sale.product?.name}
											</p>
											<p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
												{formatNaira(sale.totalPrice)}
											</p>
										</div>
										<div className="mt-0.5 flex items-baseline justify-between gap-3 text-xs text-ink-3">
											<p className="truncate">
												<span className="tabular-nums">{formatDate(sale.saleDate)}</span> ·{" "}
												{sale.customer?.name}
											</p>
											<p className="shrink-0 tabular-nums">
												{formatNumber(sale.quantity)} × {formatNaira(sale.unitPrice)}
											</p>
										</div>
									</div>
									{isAdmin && (
										<Button
											variant="ghost-danger"
											size="icon-sm"
											onClick={() => onDeleteSale(sale)}
											aria-label={`Delete sale of ${sale.product?.name}`}
											className="-mr-1.5 shrink-0"
										>
											<Trash2 size={15} />
										</Button>
									)}
								</li>
							))}
						</ul>

						{/* Tablet and up: full table */}
						<div className={cn(t.wrap, "max-md:hidden")}>
							<table className={t.table}>
								<thead>
									<tr>
										<th className={t.th}>Date</th>
										{showMonthCol && <th className={cn(t.th, "max-xl:hidden")}>Month</th>}
										<th className={t.th}>Product</th>
										<th className={t.th}>Customer</th>
										<th className={cn(t.th, "text-right")}>Qty</th>
										<th className={cn(t.th, "text-right max-xl:hidden")}>Unit price</th>
										<th className={cn(t.th, "text-right")}>Total</th>
										{isAdmin && (
											<th className={cn(t.th, "w-12 text-right")}>
												<span className="sr-only">Actions</span>
											</th>
										)}
									</tr>
								</thead>
								<tbody>
									{visible.map((sale) => (
										<tr key={sale.id} className={cn(t.tr, "group")}>
											<td className={cn(t.td, "whitespace-nowrap tabular-nums")}>
												{formatDate(sale.saleDate)}
											</td>
											{showMonthCol && (
												<td className={cn(t.td, "whitespace-nowrap max-xl:hidden")}>{sale.month}</td>
											)}
											<td className={t.td}>
												<p className="font-medium text-ink">{sale.product?.name}</p>
												{sale.product?.category && (
													<p className="text-xs text-ink-3">{sale.product.category}</p>
												)}
											</td>
											<td className={t.td}>
												<div className="flex items-center gap-2.5">
													<Avatar name={sale.customer?.name || "?"} size="sm" />
													<span className="text-ink">{sale.customer?.name}</span>
												</div>
											</td>
											<td className={cn(t.td, "text-right tabular-nums")}>
												{formatNumber(sale.quantity)}
											</td>
											<td className={cn(t.td, "text-right tabular-nums whitespace-nowrap max-xl:hidden")}>
												{formatNaira(sale.unitPrice)}
											</td>
											<td
												className={cn(
													t.td,
													"text-right font-semibold text-ink tabular-nums whitespace-nowrap"
												)}
											>
												{formatNaira(sale.totalPrice)}
											</td>
											{isAdmin && (
												<td className={cn(t.td, "text-right")}>
													<Button
														variant="ghost-danger"
														size="icon-sm"
														onClick={() => onDeleteSale(sale)}
														aria-label={`Delete sale of ${sale.product?.name}`}
														title="Delete sale"
														className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100"
													>
														<Trash2 size={15} />
													</Button>
												</td>
											)}
										</tr>
									))}
								</tbody>
								{visible.length === filtered.length && (
									<tfoot>
										<tr>
											<td className={t.tfoot} colSpan={3}>
												Total
											</td>
											{showMonthCol && <td className={cn(t.tfoot, "max-xl:hidden")} />}
											<td className={cn(t.tfoot, "text-right tabular-nums")}>
												{formatNumber(totals.units)}
											</td>
											<td className={cn(t.tfoot, "max-xl:hidden")} />
											<td className={cn(t.tfoot, "text-right tabular-nums whitespace-nowrap")}>
												{formatNaira(totals.revenue)}
											</td>
											{isAdmin && <td className={t.tfoot} />}
										</tr>
									</tfoot>
								)}
							</table>
						</div>

						<ShowMore
							shown={visible.length}
							total={filtered.length}
							noun="sales"
							onMore={() => setLimit((l) => l + PAGE_SIZE)}
							onAll={() => setLimit(filtered.length)}
						/>
					</>
				)}
			</Card>
		</div>
	);
}
