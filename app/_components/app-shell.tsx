"use client";

import React, { useEffect, useState } from "react";
import {
	Download,
	LayoutDashboard,
	LogOut,
	Menu,
	Package,
	Receipt,
	RefreshCw,
	Users,
	X,
} from "lucide-react";
import type { TabId, User } from "../_lib/types";
import { cn } from "../_lib/format";
import { Avatar, Button } from "./ui";
import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./brand";

export const NAV_ITEMS: Array<{
	id: TabId;
	label: string;
	description: string;
	icon: React.ReactNode;
}> = [
	{
		id: "dashboard",
		label: "Dashboard",
		description: "How the business is doing",
		icon: <LayoutDashboard size={18} />,
	},
	{
		id: "sales",
		label: "Sales",
		description: "Record and review sales",
		icon: <Receipt size={18} />,
	},
	{
		id: "products",
		label: "Products",
		description: "Inventory and stock levels",
		icon: <Package size={18} />,
	},
	{
		id: "customers",
		label: "Customers",
		description: "People and businesses you sell to",
		icon: <Users size={18} />,
	},
];

function Sidebar({
	activeTab,
	onNavigate,
	user,
	onLogout,
	lowStockCount,
	onClose,
}: {
	activeTab: TabId;
	onNavigate: (tab: TabId) => void;
	user: User | null;
	onLogout: () => void;
	lowStockCount: number;
	onClose?: () => void;
}) {
	const roleLabel = user?.role === "ADMIN" ? "Administrator" : "Staff";

	return (
		<div className="flex h-full flex-col">
			<div className="flex h-16 items-center justify-between gap-3 px-5">
				<div className="flex items-center gap-2.5">
					<BrandMark className="h-8 w-8" />
					<div className="leading-tight">
						<p className="text-sm font-semibold tracking-tight text-ink">
							Eadrack
						</p>
						<p className="text-[11px] text-ink-3">Trading CRM</p>
					</div>
				</div>
				{onClose && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close menu"
					>
						<X size={18} />
					</Button>
				)}
			</div>

			<nav className="mt-2 flex-1 px-3" aria-label="Main">
				<p className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-ink-3">
					Workspace
				</p>
				<ul className="space-y-0.5">
					{NAV_ITEMS.map((item) => {
						const active = item.id === activeTab;
						return (
							<li key={item.id}>
								<button
									type="button"
									onClick={() => onNavigate(item.id)}
									aria-current={active ? "page" : undefined}
									className={cn(
										"group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer",
										active
											? "bg-accent-soft text-accent-ink"
											: "text-ink-2 hover:bg-subtle hover:text-ink"
									)}
								>
									<span
										className={cn(
											"transition-colors",
											active ? "text-accent" : "text-ink-3 group-hover:text-ink-2"
										)}
									>
										{item.icon}
									</span>
									{item.label}
									{item.id === "products" && lowStockCount > 0 && (
										<span
											className="ml-auto rounded-full bg-warning-soft px-1.5 py-px text-[11px] font-semibold text-warning tabular-nums"
											title={`${lowStockCount} product(s) low on stock`}
										>
											{lowStockCount}
										</span>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			</nav>

			<div className="border-t border-line p-3">
				<div className="flex items-center gap-3 rounded-lg px-2 py-2">
					<Avatar name={user?.fullName || "User"} />
					<div className="min-w-0 flex-1 leading-tight">
						<p className="truncate text-sm font-medium text-ink">
							{user?.fullName}
						</p>
						<p className="truncate text-xs text-ink-3">{roleLabel}</p>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onLogout}
						aria-label="Sign out"
						title="Sign out"
					>
						<LogOut size={16} />
					</Button>
				</div>
			</div>
		</div>
	);
}

export function AppShell({
	activeTab,
	onNavigate,
	user,
	onLogout,
	onExport,
	onRefresh,
	refreshing,
	lowStockCount,
	children,
}: {
	activeTab: TabId;
	onNavigate: (tab: TabId) => void;
	user: User | null;
	onLogout: () => void;
	onExport: () => void;
	onRefresh: () => void;
	refreshing: boolean;
	lowStockCount: number;
	children: React.ReactNode;
}) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const current = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

	useEffect(() => {
		if (!mobileOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [mobileOpen]);

	const navigate = (tab: TabId) => {
		onNavigate(tab);
		setMobileOpen(false);
		window.scrollTo({ top: 0 });
	};

	const sidebarProps = {
		activeTab,
		onNavigate: navigate,
		user,
		onLogout,
		lowStockCount,
	};

	return (
		<div className="min-h-screen bg-canvas">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
				<Sidebar {...sidebarProps} />
			</aside>

			{/* Mobile drawer */}
			{mobileOpen && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<div
						className="absolute inset-0 bg-overlay animate-fade-in"
						onClick={() => setMobileOpen(false)}
						aria-hidden
					/>
					<aside className="relative h-full w-72 max-w-[85vw] border-r border-line bg-surface shadow-pop animate-slide-in-left">
						<Sidebar {...sidebarProps} onClose={() => setMobileOpen(false)} />
					</aside>
				</div>
			)}

			<div className="lg:pl-64">
				{/* Top bar */}
				<header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md">
					<div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
						<Button
							variant="ghost"
							size="icon"
							className="-ml-2 lg:hidden"
							onClick={() => setMobileOpen(true)}
							aria-label="Open menu"
						>
							<Menu size={20} />
						</Button>

						<div className="min-w-0 flex-1">
							<h1 className="truncate text-base sm:text-lg font-semibold tracking-tight text-ink">
								{current.label}
							</h1>
							<p className="hidden sm:block truncate text-xs text-ink-3">
								{current.description}
							</p>
						</div>

						<div className="flex items-center gap-1.5 sm:gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={onRefresh}
								disabled={refreshing}
								aria-label="Refresh data"
								title="Refresh data"
							>
								<RefreshCw
									size={17}
									className={refreshing ? "animate-spin" : undefined}
								/>
							</Button>
							<ThemeToggle />
							<Button
								variant="secondary"
								onClick={onExport}
								title="Download a CSV report"
								className="max-sm:px-2.5"
							>
								<Download size={16} />
								<span className="hidden sm:inline">Export</span>
							</Button>
						</div>
					</div>
				</header>

				<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					{children}
				</main>
			</div>
		</div>
	);
}
