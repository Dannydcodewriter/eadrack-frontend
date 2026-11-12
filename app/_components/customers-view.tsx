"use client";

import React, { useState } from "react";
import {
	ChevronRight,
	Loader2,
	Mail,
	Phone,
	Plus,
	Trash2,
	UserRound,
	Users,
} from "lucide-react";
import type { Customer } from "../_lib/types";
import { cn, formatNaira, formatNumber, realEmail, realPhone } from "../_lib/format";
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
	ShowMore,
	tableClasses as t,
} from "./ui";

export interface NewCustomerForm {
	name: string;
	email: string;
	phone: string;
}

export function CustomersView({
	customers,
	isAdmin,
	newCustomer,
	onNewCustomerChange,
	onAddCustomer,
	onDeleteCustomer,
	onViewCustomer,
	searchTerm,
	onSearchTermChange,
	submitting,
	loadingCustomerId,
}: {
	customers: Customer[];
	isAdmin: boolean;
	newCustomer: NewCustomerForm;
	onNewCustomerChange: (form: NewCustomerForm) => void;
	onAddCustomer: () => void;
	onDeleteCustomer: (customer: Customer) => void;
	onViewCustomer: (id: string) => void;
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	submitting: boolean;
	loadingCustomerId: string | null;
}) {
	const [showForm, setShowForm] = useState(customers.length === 0);
	const [limit, setLimit] = useState(PAGE_SIZE);

	const term = searchTerm.trim().toLowerCase();
	const filtered = customers.filter(
		(c) =>
			c.name.toLowerCase().includes(term) ||
			(c.email && c.email.toLowerCase().includes(term)) ||
			(c.phone ?? "").includes(searchTerm.trim())
	);
	const visible = filtered.slice(0, limit);

	const canSubmit = !!newCustomer.name && !!newCustomer.phone;

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (canSubmit && !submitting) onAddCustomer();
	};

	const set = (key: keyof NewCustomerForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
		onNewCustomerChange({ ...newCustomer, [key]: e.target.value });

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader
					icon={<UserRound size={16} />}
					title="Add a customer"
					description="Name and phone number are required."
					action={
						<Button
							variant={showForm ? "ghost" : "secondary"}
							size="sm"
							onClick={() => setShowForm((v) => !v)}
							aria-expanded={showForm}
						>
							{showForm ? "Hide" : (<><Plus size={14} /> New customer</>)}
						</Button>
					}
					className={showForm ? undefined : "pb-5"}
				/>
				{showForm && (
					<form onSubmit={submit} className="p-5">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<Field label="Full name" required>
								{(id) => (
									<Input id={id} autoComplete="off" placeholder="e.g. Adaeze Okafor" value={newCustomer.name} onChange={set("name")} />
								)}
							</Field>
							<Field label="Phone number" required>
								{(id) => (
									<Input id={id} type="tel" icon={<Phone size={15} />} placeholder="0801 234 5678" value={newCustomer.phone} onChange={set("phone")} />
								)}
							</Field>
							<Field label="Email" hint="Optional">
								{(id) => (
									<Input id={id} type="email" icon={<Mail size={15} />} placeholder="name@example.com" value={newCustomer.email} onChange={set("email")} />
								)}
							</Field>
						</div>
						<div className="mt-5 flex justify-end">
							<Button type="submit" disabled={!canSubmit} loading={submitting}>
								{!submitting && <Plus size={16} />}
								Add customer
							</Button>
						</div>
					</form>
				)}
			</Card>

			<Card className="overflow-hidden">
				<div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
					<div>
						<h3 className="text-[15px] font-semibold tracking-tight text-ink">
							All customers
						</h3>
						<p className="mt-0.5 text-[13px] text-ink-3 tabular-nums">
							{searchTerm
								? `${formatNumber(filtered.length)} of ${formatNumber(customers.length)} customers`
								: `${formatNumber(customers.length)} customers`}
						</p>
					</div>
					<SearchInput
						value={searchTerm}
						onChange={(v) => {
							onSearchTermChange(v);
							setLimit(PAGE_SIZE);
						}}
						placeholder="Search name, email or phone"
						className="sm:w-72"
					/>
				</div>

				{filtered.length === 0 ? (
					<div className="border-t border-line">
						<EmptyState
							icon={<Users size={20} />}
							title={customers.length ? "No matching customers" : "No customers yet"}
							description={
								customers.length
									? "Try a different name, email or phone number."
									: "Add your first customer to start recording sales."
							}
						/>
					</div>
				) : (
					<>
						{/* Phones: compact cards (tap to open details) */}
						<ul className="divide-y divide-line border-t border-line md:hidden">
							{visible.map((customer) => (
								<li key={customer.id} className="flex items-center gap-1 pr-2">
									<button
										type="button"
										onClick={() => onViewCustomer(customer.id)}
										className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-subtle cursor-pointer"
									>
										<Avatar name={customer.name} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-ink">{customer.name}</p>
											<p className="mt-0.5 truncate text-xs text-ink-3 tabular-nums">
												<span className="font-semibold text-ink-2">
													{formatNaira(customer.totalSpent)}
												</span>
												{" · "}
												{formatNumber(customer.totalPurchases)} order
												{customer.totalPurchases === 1 ? "" : "s"}
												{contactLine(customer) && ` · ${contactLine(customer)}`}
											</p>
										</div>
										{loadingCustomerId === customer.id ? (
											<Loader2 size={16} className="shrink-0 animate-spin text-ink-3" />
										) : (
											<ChevronRight size={16} className="shrink-0 text-ink-3" />
										)}
									</button>
									{isAdmin && (
										<Button
											variant="ghost-danger"
											size="icon-sm"
											onClick={() => onDeleteCustomer(customer)}
											aria-label={`Delete ${customer.name}`}
											className="shrink-0"
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
										<th className={t.th}>Customer</th>
										<th className={t.th}>Phone</th>
										<th className={cn(t.th, "text-right")}>Orders</th>
										<th className={cn(t.th, "text-right")}>Total spent</th>
										<th className={cn(t.th, "w-24")}>
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{visible.map((customer) => (
										<tr
											key={customer.id}
											className={cn(t.tr, "group cursor-pointer")}
											onClick={() => onViewCustomer(customer.id)}
										>
											<td className={t.td}>
												<div className="flex items-center gap-3">
													<Avatar name={customer.name} />
													<div className="min-w-0">
														<p className="truncate font-medium text-ink">{customer.name}</p>
														<p className="truncate text-xs text-ink-3">
															{realEmail(customer) ?? "No email"}
														</p>
													</div>
												</div>
											</td>
											<td className={cn(t.td, "whitespace-nowrap tabular-nums")}>
												{realPhone(customer) ?? "—"}
											</td>
											<td className={cn(t.td, "text-right tabular-nums")}>
												{formatNumber(customer.totalPurchases)}
											</td>
											<td className={cn(t.td, "text-right font-semibold text-ink tabular-nums whitespace-nowrap")}>
												{formatNaira(customer.totalSpent)}
											</td>
											<td className={cn(t.td, "text-right")}>
												<div className="flex items-center justify-end gap-1">
													{isAdmin && (
														<Button
															variant="ghost-danger"
															size="icon-sm"
															onClick={(e) => {
																e.stopPropagation();
																onDeleteCustomer(customer);
															}}
															aria-label={`Delete ${customer.name}`}
															title="Delete customer"
															className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100"
														>
															<Trash2 size={15} />
														</Button>
													)}
													<Button
														variant="ghost"
														size="icon-sm"
														loading={loadingCustomerId === customer.id}
														onClick={(e) => {
															e.stopPropagation();
															onViewCustomer(customer.id);
														}}
														aria-label={`View ${customer.name}`}
														title="View details"
													>
														{loadingCustomerId !== customer.id && <ChevronRight size={16} />}
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<ShowMore
							shown={visible.length}
							total={filtered.length}
							noun="customers"
							onMore={() => setLimit((l) => l + PAGE_SIZE)}
							onAll={() => setLimit(filtered.length)}
						/>
					</>
				)}
			</Card>
		</div>
	);
}

const contactLine = (c: Customer) => realPhone(c) || realEmail(c) || "";
