"use client";

import { Mail, Phone, Receipt } from "lucide-react";
import type { Customer } from "../_lib/types";
import { cn, formatDate, formatNaira, formatNumber, realEmail, realPhone } from "../_lib/format";
import { Avatar, EmptyState, Meter, Modal, tableClasses as t } from "./ui";

export function CustomerModal({
	customer,
	onClose,
}: {
	customer: Customer | null;
	onClose: () => void;
}) {
	const a = customer?.analytics;
	const products = a?.productsPurchased ?? [];
	const history = a?.salesHistory ?? [];
	const maxProductTotal = Math.max(...products.map((p) => p.total), 1);

	const stats = [
		{ label: "Orders", value: formatNumber(a?.totalPurchases) },
		{ label: "Total spent", value: formatNaira(a?.totalSpent) },
		{ label: "Items bought", value: formatNumber(a?.totalItems) },
		{ label: "Last purchase", value: formatDate(a?.lastPurchase) },
	];

	return (
		<Modal open={!!customer} onClose={onClose} size="xl" title="Customer details">
			{customer && (
				<div className="space-y-6 p-5 sm:p-6">
					{/* Identity */}
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
						<Avatar name={customer.name} size="lg" />
						<div className="min-w-0">
							<h3 className="text-xl font-semibold tracking-tight text-ink">
								{customer.name}
							</h3>
							<div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
								<span className="inline-flex items-center gap-1.5">
									<Phone size={14} className="text-ink-3" />
									{realPhone(customer) ?? "No phone on file"}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<Mail size={14} className="text-ink-3" />
									{realEmail(customer) ?? "No email on file"}
								</span>
							</div>
						</div>
					</div>

					{/* Stats */}
					<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
						{stats.map((s) => (
							<div key={s.label} className="bg-surface px-4 py-3.5">
								<dt className="text-xs text-ink-3">{s.label}</dt>
								<dd className="mt-1 text-lg font-semibold tracking-tight text-ink tabular-nums">
									{s.value}
								</dd>
							</div>
						))}
					</dl>

					{history.length === 0 && products.length === 0 ? (
						<div className="rounded-xl border border-dashed border-line">
							<EmptyState
								icon={<Receipt size={20} />}
								title="No purchases yet"
								description="Sales recorded for this customer will appear here."
							/>
						</div>
					) : (
						<>
							{products.length > 0 && (
								<section>
									<h4 className="mb-3 text-sm font-semibold text-ink">
										Products purchased
									</h4>
									<ul className="divide-y divide-line rounded-xl border border-line">
										{[...products]
											.sort((x, y) => y.total - x.total)
											.map((item, i) => (
												<li key={item.product?.id ?? i} className="px-4 py-3">
													<div className="flex items-baseline justify-between gap-3">
														<p className="truncate text-sm font-medium text-ink">
															{item.product?.name}
														</p>
														<p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
															{formatNaira(item.total)}
														</p>
													</div>
													<div className="mt-2 flex items-center gap-3">
														<Meter value={(item.total / maxProductTotal) * 100} />
														<span className="w-40 shrink-0 text-right text-xs text-ink-3 tabular-nums">
															{formatNumber(item.quantity)} unit{item.quantity === 1 ? "" : "s"} · {formatNaira(item.product?.price)} ea
														</span>
													</div>
												</li>
											))}
									</ul>
								</section>
							)}

							{history.length > 0 && (
								<section>
									<h4 className="mb-3 text-sm font-semibold text-ink">
										Purchase history
									</h4>
									{/* Phones: simple list */}
									<ul className="divide-y divide-line rounded-xl border border-line sm:hidden">
										{history.map((sale, index) => (
											<li key={index} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
												<div className="min-w-0">
													<p className="truncate text-sm text-ink">{sale.product?.name}</p>
													<p className="text-xs text-ink-3 tabular-nums">
														{formatDate(sale.saleDate ?? sale.date)} · {formatNumber(sale.quantity)} unit{sale.quantity === 1 ? "" : "s"}
													</p>
												</div>
												<p className="shrink-0 text-sm font-medium text-ink tabular-nums">
													{formatNaira(
														sale.totalPrice ?? (sale.product?.price ?? 0) * sale.quantity
													)}
												</p>
											</li>
										))}
									</ul>
									<div className="overflow-hidden rounded-xl border border-line max-sm:hidden">
										<div className={t.wrap}>
											<table className={cn(t.table, "min-w-[520px]")}>
												<thead>
													<tr>
														<th className={cn(t.th, "border-t-0")}>Date</th>
														<th className={cn(t.th, "border-t-0")}>Product</th>
														<th className={cn(t.th, "border-t-0")}>Month</th>
														<th className={cn(t.th, "border-t-0 text-right")}>Qty</th>
														<th className={cn(t.th, "border-t-0 text-right")}>Total</th>
													</tr>
												</thead>
												<tbody>
													{history.map((sale, index) => (
														<tr key={index} className={cn(t.tr, "[&:last-child>td]:border-b-0")}>
															<td className={cn(t.td, "whitespace-nowrap tabular-nums")}>
																{formatDate(sale.saleDate ?? sale.date)}
															</td>
															<td className={cn(t.td, "text-ink")}>{sale.product?.name}</td>
															<td className={t.td}>{sale.month}</td>
															<td className={cn(t.td, "text-right tabular-nums")}>
																{formatNumber(sale.quantity)}
															</td>
															<td className={cn(t.td, "text-right font-medium text-ink tabular-nums whitespace-nowrap")}>
																{formatNaira(
																	sale.totalPrice ??
																		(sale.product?.price ?? 0) * sale.quantity
																)}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</section>
							)}
						</>
					)}
				</div>
			)}
		</Modal>
	);
}
