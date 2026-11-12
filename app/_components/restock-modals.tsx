"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	History,
	PackagePlus,
	Plus,
	Ship,
	Trash2,
	XCircle,
} from "lucide-react";
import type {
	Product,
	RestockInput,
	ShipmentInput,
	StockAdjustment,
} from "../_lib/types";
import { productAPI } from "../_lib/api";
import {
	cn,
	formatDate,
	formatNaira,
	formatNumber,
	stockStatus,
	type StockStatus,
} from "../_lib/format";
import { Badge, Button, Field, Input, Modal, Select } from "./ui";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

export function StatusBadge({ status }: { status: StockStatus }) {
	if (status === "out")
		return (
			<Badge tone="danger" icon={<XCircle size={12} />}>
				Out of stock
			</Badge>
		);
	if (status === "low")
		return (
			<Badge tone="warning" icon={<AlertTriangle size={12} />}>
				Low stock
			</Badge>
		);
	return (
		<Badge tone="success" icon={<CheckCircle2 size={12} />}>
			In stock
		</Badge>
	);
}

const statusFor = (product: Product, currentStock: number) =>
	stockStatus({ ...product, currentStock });

const parseQty = (value: string) => {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : null;
};

/** Returns the new price only when it is valid and actually different. */
const changedPrice = (value: string, current: number) => {
	if (value.trim() === "") return undefined;
	const n = Number(value);
	return Number.isFinite(n) && n >= 0 && n !== current ? n : undefined;
};

const invalidPrice = (value: string) =>
	value.trim() !== "" && !(Number.isFinite(Number(value)) && Number(value) >= 0);

const optional = (value: string) => value.trim() || undefined;

/* ------------------------------------------------------------------ */
/* Restock one product                                                 */
/* ------------------------------------------------------------------ */

export function RestockModal({
	product,
	onClose,
	onSubmit,
}: {
	product: Product | null;
	onClose: () => void;
	onSubmit: (product: Product, input: RestockInput) => Promise<boolean>;
}) {
	return (
		<Modal
			open={!!product}
			onClose={onClose}
			size="lg"
			title={product ? `Restock ${product.name}` : "Restock"}
			description="Record goods you’ve received for this product."
		>
			{product && (
				<RestockForm
					key={product.id}
					product={product}
					onClose={onClose}
					onSubmit={onSubmit}
				/>
			)}
		</Modal>
	);
}

function RestockForm({
	product,
	onClose,
	onSubmit,
}: {
	product: Product;
	onClose: () => void;
	onSubmit: (product: Product, input: RestockInput) => Promise<boolean>;
}) {
	const [quantity, setQuantity] = useState("");
	const [price, setPrice] = useState(String(product.price));
	const [supplier, setSupplier] = useState(product.supplier ?? "");
	const [reference, setReference] = useState("");
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);
	const [history, setHistory] = useState<StockAdjustment[] | null>(null);
	const qtyRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		qtyRef.current?.focus();
		let cancelled = false;
		productAPI
			.getStockHistory(product.id, { type: "ADDITION", limit: 5 })
			.then((d) => !cancelled && setHistory(d.history))
			.catch(() => !cancelled && setHistory([]));
		return () => {
			cancelled = true;
		};
	}, [product.id]);

	const qty = parseQty(quantity);
	const after = product.currentStock + (qty ?? 0);
	const nowStatus = stockStatus(product);
	const afterStatus = statusFor(product, after);
	const priceIsInvalid = invalidPrice(price);
	const newPrice = changedPrice(price, product.price);
	const canSubmit = !!qty && !priceIsInvalid && !busy;

	const bump = (n: number) =>
		setQuantity((q) => String((parseQty(q) ?? 0) + n));

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit || !qty) return;
		setBusy(true);
		const ok = await onSubmit(product, {
			quantity: qty,
			...(newPrice !== undefined && { price: newPrice }),
			supplier: optional(supplier),
			reference: optional(reference),
			note: optional(note),
		});
		setBusy(false);
		if (ok) onClose();
	};

	return (
		<form onSubmit={submit}>
			<div className="space-y-5 p-5 sm:p-6">
				{/* Current state */}
				<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
					<div className="col-span-2 bg-surface px-4 py-3 sm:col-span-1">
						<dt className="text-xs text-ink-3">On hand</dt>
						<dd className="mt-1 flex flex-wrap items-center gap-2">
							<span className="text-lg font-semibold text-ink tabular-nums">
								{formatNumber(product.currentStock)}
							</span>
							<StatusBadge status={nowStatus} />
						</dd>
					</div>
					<div className="bg-surface px-4 py-3">
						<dt className="text-xs text-ink-3">Reorder level</dt>
						<dd className="mt-1 text-lg font-semibold text-ink tabular-nums">
							{formatNumber(product.reorderLevel)}
						</dd>
					</div>
					<div className="bg-surface px-4 py-3">
						<dt className="text-xs text-ink-3">Selling price</dt>
						<dd className="mt-1 text-lg font-semibold text-ink tabular-nums">
							{formatNaira(product.price)}
						</dd>
					</div>
				</dl>

				{/* Quantity */}
				<Field label="Quantity received" required>
					{(id) => (
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<Input
								ref={qtyRef}
								id={id}
								type="number"
								inputMode="numeric"
								min={1}
								step={1}
								placeholder="0"
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
								className="tabular-nums sm:max-w-40"
							/>
							<div className="flex flex-wrap gap-1.5" aria-label="Quick add">
								{[10, 25, 50, 100].map((n) => (
									<button
										key={n}
										type="button"
										onClick={() => bump(n)}
										className="h-8 rounded-lg border border-line bg-surface px-2.5 text-[13px] font-medium text-ink-2 tabular-nums hover:border-line-strong hover:bg-subtle hover:text-ink cursor-pointer"
									>
										+{n}
									</button>
								))}
							</div>
						</div>
					)}
				</Field>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Field
						label="Selling price (₦)"
						hint={
							priceIsInvalid
								? "Enter a valid price"
								: newPrice !== undefined
								? `Price will change from ${formatNaira(product.price)}`
								: "Change only if the new goods sell at a different price"
						}
					>
						{(id) => (
							<Input
								id={id}
								type="number"
								inputMode="decimal"
								min={0}
								step="0.01"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								aria-invalid={priceIsInvalid || undefined}
								className={cn(
									"tabular-nums",
									priceIsInvalid && "border-danger focus:border-danger"
								)}
							/>
						)}
					</Field>
					<Field label="Supplier" hint="Optional">
						{(id) => (
							<Input
								id={id}
								placeholder="Who shipped it"
								value={supplier}
								onChange={(e) => setSupplier(e.target.value)}
							/>
						)}
					</Field>
					<Field label="Shipment / invoice no." hint="Optional">
						{(id) => (
							<Input
								id={id}
								placeholder="e.g. INV-2026-014"
								value={reference}
								onChange={(e) => setReference(e.target.value)}
							/>
						)}
					</Field>
					<Field label="Note" hint="Optional">
						{(id) => (
							<Input
								id={id}
								placeholder="e.g. Container arrived Lagos port"
								value={note}
								onChange={(e) => setNote(e.target.value)}
							/>
						)}
					</Field>
				</div>

				{/* Preview */}
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-subtle/70 px-4 py-3">
					<div className="flex items-center gap-3 text-sm">
						<span className="text-ink-3">On hand after restock</span>
						<span className="font-medium text-ink-2 tabular-nums">
							{formatNumber(product.currentStock)}
						</span>
						<ArrowRight size={14} className="text-ink-3" />
						<span className="text-base font-semibold text-ink tabular-nums">
							{formatNumber(after)}
						</span>
					</div>
					{qty ? <StatusBadge status={afterStatus} /> : null}
				</div>
				{qty && afterStatus !== "ok" && (
					<p className="-mt-3 flex items-center gap-1.5 text-xs text-warning">
						<AlertTriangle size={13} />
						Still at or below the reorder level of {formatNumber(product.reorderLevel)}.
					</p>
				)}

				{/* History */}
				<section>
					<h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
						<History size={14} /> Recent restocks
					</h4>
					{history === null ? (
						<div className="space-y-2">
							{[0, 1].map((i) => (
								<div key={i} className="h-10 animate-pulse rounded-lg bg-subtle" />
							))}
						</div>
					) : history.length === 0 ? (
						<p className="rounded-lg border border-dashed border-line px-4 py-3 text-[13px] text-ink-3">
							No restocks recorded yet for this product.
						</p>
					) : (
						<ul className="divide-y divide-line rounded-xl border border-line">
							{history.map((h) => (
								<li key={h.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
									<div className="min-w-0">
										<p className="truncate text-[13px] text-ink">
											{h.reason?.replace(/^Restock( · )?/, "") || "Restock"}
										</p>
										<p className="text-xs text-ink-3">
											{formatDate(h.createdAt)}
											{h.adjustedBy?.fullName && ` · ${h.adjustedBy.fullName}`}
										</p>
									</div>
									<span className="shrink-0 text-sm font-semibold text-success tabular-nums">
										+{formatNumber(h.quantityChange)}
									</span>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>

			<div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
				<Button variant="secondary" onClick={onClose} disabled={busy}>
					Cancel
				</Button>
				<Button type="submit" disabled={!canSubmit} loading={busy}>
					{!busy && <PackagePlus size={16} />}
					{qty ? `Add ${formatNumber(qty)} unit${qty === 1 ? "" : "s"}` : "Add stock"}
				</Button>
			</div>
		</form>
	);
}

/* ------------------------------------------------------------------ */
/* Receive a shipment (many products at once)                          */
/* ------------------------------------------------------------------ */

interface Line {
	key: number;
	productId: string;
	quantity: string;
	price: string;
}

let lineKey = 0;
const newLine = (productId = ""): Line => ({
	key: lineKey++,
	productId,
	quantity: "",
	price: "",
});

export function ShipmentModal({
	open,
	products,
	initialProductIds,
	onClose,
	onSubmit,
}: {
	open: boolean;
	products: Product[];
	initialProductIds: string[];
	onClose: () => void;
	onSubmit: (input: ShipmentInput) => Promise<boolean>;
}) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			size="xl"
			title="Receive a shipment"
			description="Add every product that arrived in this shipment. Stock for all of them is updated together."
		>
			{open && (
				<ShipmentForm
					products={products}
					initialProductIds={initialProductIds}
					onClose={onClose}
					onSubmit={onSubmit}
				/>
			)}
		</Modal>
	);
}

function ShipmentForm({
	products,
	initialProductIds,
	onClose,
	onSubmit,
}: {
	products: Product[];
	initialProductIds: string[];
	onClose: () => void;
	onSubmit: (input: ShipmentInput) => Promise<boolean>;
}) {
	const [lines, setLines] = useState<Line[]>(() =>
		initialProductIds.length ? initialProductIds.map((id) => newLine(id)) : [newLine()]
	);
	const [reference, setReference] = useState("");
	const [supplier, setSupplier] = useState("");
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);
	const [showErrors, setShowErrors] = useState(false);

	const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
	const sortedProducts = useMemo(
		() => [...products].sort((a, b) => a.name.localeCompare(b.name)),
		[products]
	);
	const needsRestock = products.filter((p) => stockStatus(p) !== "ok");
	const missingNeeds = needsRestock.filter(
		(p) => !lines.some((l) => l.productId === p.id)
	);

	const update = (key: number, patch: Partial<Line>) =>
		setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
	const remove = (key: number) =>
		setLines((ls) => (ls.length === 1 ? [newLine()] : ls.filter((l) => l.key !== key)));
	const addNeeds = () =>
		setLines((ls) => [
			...ls.filter((l) => l.productId || l.quantity),
			...missingNeeds.map((p) => newLine(p.id)),
		]);

	const active = lines.filter((l) => l.productId);
	const lineError = (l: Line) =>
		!l.productId
			? null
			: !parseQty(l.quantity)
			? "Enter a quantity"
			: invalidPrice(l.price)
			? "Invalid price"
			: null;
	const hasErrors = active.some((l) => lineError(l));
	const totalUnits = active.reduce((sum, l) => sum + (parseQty(l.quantity) ?? 0), 0);
	const canSubmit = active.length > 0 && !busy;

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		if (hasErrors) {
			setShowErrors(true);
			return;
		}
		setBusy(true);
		const ok = await onSubmit({
			items: active.map((l) => {
				const product = byId.get(l.productId)!;
				const price = changedPrice(l.price, product.price);
				return {
					productId: l.productId,
					quantity: parseQty(l.quantity)!,
					...(price !== undefined && { price }),
				};
			}),
			reference: optional(reference),
			supplier: optional(supplier),
			note: optional(note),
		});
		setBusy(false);
		if (ok) onClose();
	};

	return (
		<form onSubmit={submit}>
			<div className="space-y-5 p-5 sm:p-6">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Field label="Shipment / invoice no." hint="Optional">
						{(id) => (
							<Input
								id={id}
								placeholder="e.g. BL-2026-0193"
								value={reference}
								onChange={(e) => setReference(e.target.value)}
								autoFocus
							/>
						)}
					</Field>
					<Field label="Supplier" hint="Optional — applied to every product">
						{(id) => (
							<Input
								id={id}
								placeholder="Who shipped it"
								value={supplier}
								onChange={(e) => setSupplier(e.target.value)}
							/>
						)}
					</Field>
					<Field label="Note" hint="Optional">
						{(id) => (
							<Input
								id={id}
								placeholder="e.g. Cleared at Apapa port"
								value={note}
								onChange={(e) => setNote(e.target.value)}
							/>
						)}
					</Field>
				</div>

				<section>
					<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
						<h4 className="text-[13px] font-medium text-ink-2">Products received</h4>
						{missingNeeds.length > 0 && (
							<Button variant="ghost" size="sm" onClick={addNeeds}>
								<AlertTriangle size={14} className="text-warning" />
								Add all that need restocking ({missingNeeds.length})
							</Button>
						)}
					</div>

					<div className="rounded-xl border border-line">
						<div className="hidden grid-cols-[minmax(0,1fr)_120px_150px_36px] gap-3 border-b border-line bg-subtle/70 px-4 py-2 text-xs font-medium text-ink-3 sm:grid rounded-t-xl">
							<span>Product</span>
							<span>Qty received</span>
							<span>New price (₦)</span>
							<span className="sr-only">Remove</span>
						</div>
						<ul className="divide-y divide-line">
							{lines.map((line, index) => {
								const product = byId.get(line.productId);
								const qty = parseQty(line.quantity) ?? 0;
								const error = showErrors ? lineError(line) : null;
								const taken = new Set(
									lines.filter((l) => l.key !== line.key).map((l) => l.productId)
								);
								return (
									<li
										key={line.key}
										className="grid grid-cols-[1fr_1fr_36px] gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px_150px_36px] sm:items-start"
									>
										<div className="col-span-3 sm:col-span-1">
											<Select
												aria-label={`Product, line ${index + 1}`}
												value={line.productId}
												onChange={(e) => update(line.key, { productId: e.target.value })}
											>
												<option value="">Select a product</option>
												{sortedProducts.map((p) => (
													<option key={p.id} value={p.id} disabled={taken.has(p.id)}>
														{p.name}
														{stockStatus(p) === "out"
															? " — out of stock"
															: stockStatus(p) === "low"
															? " — low stock"
															: ""}
													</option>
												))}
											</Select>
											{product && (
												<p className="mt-1.5 text-xs text-ink-3 tabular-nums">
													On hand {formatNumber(product.currentStock)}
													{qty > 0 && (
														<>
															{" "}→{" "}
															<span className="font-medium text-ink">
																{formatNumber(product.currentStock + qty)}
															</span>
														</>
													)}
													{" · "}reorder at {formatNumber(product.reorderLevel)}
												</p>
											)}
											{error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
										</div>
										<Input
											aria-label={`Quantity received, line ${index + 1}`}
											type="number"
											inputMode="numeric"
											min={1}
											step={1}
											placeholder="Qty"
											value={line.quantity}
											onChange={(e) => update(line.key, { quantity: e.target.value })}
											aria-invalid={(error && !parseQty(line.quantity)) || undefined}
											className={cn(
												"tabular-nums",
												error && !parseQty(line.quantity) && "border-danger"
											)}
										/>
										<Input
											aria-label={`New selling price, line ${index + 1}`}
											type="number"
											inputMode="decimal"
											min={0}
											step="0.01"
											placeholder={product ? String(product.price) : "Same price"}
											value={line.price}
											onChange={(e) => update(line.key, { price: e.target.value })}
											className="tabular-nums"
										/>
										<Button
											variant="ghost-danger"
											size="icon"
											onClick={() => remove(line.key)}
											aria-label={`Remove line ${index + 1}`}
										>
											<Trash2 size={15} />
										</Button>
									</li>
								);
							})}
						</ul>
						<div className="border-t border-line px-3 py-2">
							<Button variant="ghost" size="sm" onClick={() => setLines((ls) => [...ls, newLine()])}>
								<Plus size={14} /> Add another product
							</Button>
						</div>
					</div>
					<p className="mt-2 text-xs text-ink-3">
						Leave “New price” empty to keep each product’s current selling price.
					</p>
				</section>
			</div>

			<div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-ink-3 tabular-nums">
					<span className="font-medium text-ink">{formatNumber(active.length)}</span> product
					{active.length === 1 ? "" : "s"} ·{" "}
					<span className="font-medium text-ink">{formatNumber(totalUnits)}</span> units
				</p>
				<div className="flex flex-col-reverse gap-2 sm:flex-row">
					<Button variant="secondary" onClick={onClose} disabled={busy}>
						Cancel
					</Button>
					<Button type="submit" disabled={!canSubmit} loading={busy}>
						{!busy && <Ship size={16} />}
						Receive shipment
					</Button>
				</div>
			</div>
		</form>
	);
}
