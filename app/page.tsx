"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type {
	Customer,
	DashboardStats,
	Product,
	RevenueTrend,
	Sale,
	TabId,
	TopCustomer,
	TopProduct,
	User,
	RestockInput,
	ShipmentInput,
} from "./_lib/types";
import { MONTHS } from "./_lib/types";
import {
	SESSION_EXPIRED_EVENT,
	analyticsAPI,
	authAPI,
	customerAPI,
	productAPI,
	salesAPI,
} from "./_lib/api";
import { currentMonthName } from "./_lib/format";
import { AppShell } from "./_components/app-shell";
import { LoginScreen } from "./_components/login-screen";
import { DashboardView } from "./_components/dashboard-view";
import { SalesView, type NewSaleForm } from "./_components/sales-view";
import { ProductsView, type NewProductForm } from "./_components/products-view";
import { CustomersView, type NewCustomerForm } from "./_components/customers-view";
import { CustomerModal } from "./_components/customer-modal";
import { RestockModal, ShipmentModal } from "./_components/restock-modals";
import { BrandMark } from "./_components/brand";
import {
	ConfirmDialog,
	Toaster,
	type ConfirmOptions,
	type ToastItem,
	type ToastTone,
} from "./_components/ui";

const emptyProduct: NewProductForm = {
	name: "",
	initialStock: "",
	price: "",
	category: "",
	reorderLevel: "10",
};

const errorMessage = (error: unknown, fallback: string) =>
	error instanceof Error ? error.message : fallback;

/** Quote a CSV cell when it contains a comma, quote or newline. */
const csvCell = (value: unknown) => {
	const s = String(value ?? "");
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",") + "\n";

const EadrackApp = () => {
	// Auth State
	const [authChecked, setAuthChecked] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loginForm, setLoginForm] = useState({ email: "", password: "" });
	const [loginError, setLoginError] = useState<string>("");

	// Data State
	const [selectedMonth, setSelectedMonth] = useState<string>("All");
	const [products, setProducts] = useState<Product[]>([]);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [sales, setSales] = useState<Sale[]>([]);
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
	const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
	const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
	const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);

	// Form State
	const [newProduct, setNewProduct] = useState<NewProductForm>(emptyProduct);
	const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({
		name: "",
		email: "",
		phone: "",
	});
	const [newSale, setNewSale] = useState<NewSaleForm>(() => ({
		productId: "",
		customerId: "",
		quantity: "",
		month: currentMonthName(),
	}));

	// UI State
	const [activeTab, setActiveTab] = useState<TabId>("dashboard");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [submitting, setSubmitting] = useState<"sale" | "product" | "customer" | null>(null);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [loadingCustomerId, setLoadingCustomerId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [lowStockAlert, setLowStockAlert] = useState<boolean>(true);
	const [restockTarget, setRestockTarget] = useState<Product | null>(null);
	const [shipment, setShipment] = useState<{ open: boolean; productIds: string[] }>({
		open: false,
		productIds: [],
	});
	const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);
	const [confirmBusy, setConfirmBusy] = useState(false);
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const toastId = useRef(0);

	// ------------------------------------------------------------------
	// Notifications
	// ------------------------------------------------------------------
	const dismissToast = useCallback((id: number) => {
		setToasts((list) => list.filter((t) => t.id !== id));
	}, []);

	const notify = useCallback(
		(tone: ToastTone, message: string) => {
			const id = ++toastId.current;
			setToasts((list) => [...list.slice(-3), { id, tone, message }]);
			setTimeout(() => dismissToast(id), tone === "error" ? 6000 : 3500);
		},
		[dismissToast]
	);

	// Collects failed loads that happen together and shows ONE message,
	// instead of silently leaving lists (e.g. customers) empty.
	const failedLoads = useRef<Set<string>>(new Set());
	const reportLoadError = (what: string) => {
		if (!localStorage.getItem("token")) return; // signed out: nothing to report
		const pending = failedLoads.current;
		pending.add(what);
		if (pending.size === 1) {
			setTimeout(() => {
				const names = [...pending];
				pending.clear();
				notify(
					"error",
					`Couldn’t load ${names.join(", ")}. Check your connection, then press refresh (↻) at the top.`
				);
			}, 0);
		}
	};

	// ------------------------------------------------------------------
	// Data loading
	// ------------------------------------------------------------------
	const loadProducts = async () => {
		try {
			const data = await productAPI.getAll();
			setProducts(data.products);
		} catch (error) {
			console.error("Error loading products:", error);
			reportLoadError("products");
		}
	};

	const loadCustomers = async () => {
		try {
			const data = await customerAPI.getAll();
			setCustomers(data.customers);
		} catch (error) {
			console.error("Error loading customers:", error);
			reportLoadError("customers");
		}
	};

	const loadSales = async () => {
		try {
			const data = await salesAPI.getAll();
			setSales(data.sales);
		} catch (error) {
			console.error("Error loading sales:", error);
			reportLoadError("sales");
		}
	};

	const loadDashboardStats = async () => {
		try {
			const data = await analyticsAPI.getDashboard();
			setDashboardStats(data);
		} catch (error) {
			console.error("Error loading dashboard stats:", error);
			reportLoadError("dashboard figures");
		}
	};

	const loadTopProducts = async () => {
		try {
			const data = await analyticsAPI.getTopProducts(5);
			setTopProducts(data.topProducts);
		} catch (error) {
			console.error("Error loading top products:", error);
			reportLoadError("top products");
		}
	};

	const loadTopCustomers = async () => {
		try {
			const data = await analyticsAPI.getTopCustomers(5);
			setTopCustomers(data.topCustomers);
		} catch (error) {
			console.error("Error loading top customers:", error);
			reportLoadError("top customers");
		}
	};

	const loadRevenueTrends = async () => {
		try {
			const data = await analyticsAPI.getRevenueTrends();
			setRevenueTrends(data.trends);
		} catch (error) {
			console.error("Error loading revenue trends:", error);
			reportLoadError("revenue trends");
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setIsAuthenticated(false);
		setCurrentUser(null);
		setProducts([]);
		setCustomers([]);
		setSales([]);
		setDashboardStats(null);
		setTopProducts([]);
		setTopCustomers([]);
		setRevenueTrends([]);
		setHasLoaded(false);
		setActiveTab("dashboard");
	};

	const loadAllData = async () => {
		setIsLoading(true);
		try {
			await Promise.all([
				loadProducts(),
				loadCustomers(),
				loadSales(),
				loadDashboardStats(),
				loadTopProducts(),
				loadTopCustomers(),
				loadRevenueTrends(),
			]);
		} catch (error) {
			console.error("Error loading data:", error);
			notify("error", "Failed to load data. Please try again.");
			if (error instanceof Error && error.message.includes("token")) {
				handleLogout();
			}
		} finally {
			setIsLoading(false);
			setHasLoaded(true);
		}
	};

	const refreshAll = async () => {
		setRefreshing(true);
		await loadAllData();
		setRefreshing(false);
		notify("success", "Data refreshed");
	};

	// When the server rejects the saved login (expired after 24h, or the
	// account was deactivated), sign out cleanly instead of showing empty lists.
	useEffect(() => {
		const onExpired = () => {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			setIsAuthenticated(false);
			setCurrentUser(null);
			setHasLoaded(false);
			setLoginError("Your session has expired. Please sign in again.");
		};
		window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
		return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
	}, []);

	// Restore session on mount
	useEffect(() => {
		const token = localStorage.getItem("token");
		const user = localStorage.getItem("user");
		if (token && user) {
			try {
				setCurrentUser(JSON.parse(user));
				setIsAuthenticated(true);
				loadAllData();
			} catch {
				localStorage.removeItem("user");
			}
		}
		setAuthChecked(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ------------------------------------------------------------------
	// Auth
	// ------------------------------------------------------------------
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoginError("");
		setIsLoading(true);

		try {
			const response = await authAPI.login(loginForm);
			localStorage.setItem("token", response.token);
			localStorage.setItem("user", JSON.stringify(response.user));
			setIsAuthenticated(true);
			setCurrentUser(response.user);
			setLoginForm({ email: "", password: "" });
			await loadAllData();
		} catch (error) {
			setLoginError(errorMessage(error, "Login failed"));
		} finally {
			setIsLoading(false);
		}
	};

	// ------------------------------------------------------------------
	// Products
	// ------------------------------------------------------------------
	// After a save succeeds, confirm to the user right away and refresh the
	// affected lists in the background (each loader reports its own errors).
	const refreshInBackground = (...loaders: Array<() => Promise<void>>) => {
		void Promise.all(loaders.map((load) => load()));
	};

	const addProduct = async () => {
		if (
			!newProduct.name ||
			!newProduct.initialStock ||
			!newProduct.price ||
			!newProduct.category
		) {
			notify("error", "Please fill all required fields");
			return;
		}

		setSubmitting("product");
		try {
			await productAPI.create({
				name: newProduct.name,
				initialStock: parseInt(newProduct.initialStock),
				price: parseFloat(newProduct.price),
				category: newProduct.category,
				reorderLevel: parseInt(newProduct.reorderLevel) || 10,
			});
			setNewProduct(emptyProduct);
			notify("success", `${newProduct.name} added to inventory`);
			refreshInBackground(loadProducts, loadDashboardStats);
		} catch (error) {
			notify("error", errorMessage(error, "Failed to add product"));
		} finally {
			setSubmitting(null);
		}
	};

	const deleteProduct = (product: Product) => {
		setConfirm({
			title: `Delete ${product.name}?`,
			message:
				"This permanently removes the product and every sale recorded against it. This can’t be undone.",
			confirmLabel: "Delete product",
			onConfirm: async () => {
				try {
					await productAPI.delete(product.id);
					notify("success", "Product deleted");
					refreshInBackground(
						loadProducts,
						loadSales,
						loadDashboardStats,
						loadTopProducts,
						loadRevenueTrends
					);
				} catch (error) {
					notify("error", errorMessage(error, "Failed to delete product"));
				}
			},
		});
	};

	// ------------------------------------------------------------------
	// Customers
	// ------------------------------------------------------------------
	const addCustomer = async () => {
		if (!newCustomer.name || !newCustomer.phone) {
			notify("error", "Name and phone are required");
			return;
		}

		setSubmitting("customer");
		try {
			await customerAPI.create({
				name: newCustomer.name,
				email: newCustomer.email,
				phone: newCustomer.phone,
			});
			setNewCustomer({ name: "", email: "", phone: "" });
			notify("success", `${newCustomer.name} added`);
			refreshInBackground(loadCustomers);
		} catch (error) {
			notify("error", errorMessage(error, "Failed to add customer"));
		} finally {
			setSubmitting(null);
		}
	};

	const deleteCustomer = (customer: Customer) => {
		setConfirm({
			title: `Delete ${customer.name}?`,
			message:
				"This removes the customer and their purchase history. This can’t be undone.",
			confirmLabel: "Delete customer",
			onConfirm: async () => {
				try {
					await customerAPI.delete(customer.id);
					notify("success", "Customer deleted");
					refreshInBackground(loadCustomers, loadSales, loadTopCustomers, loadDashboardStats);
				} catch (error) {
					notify("error", errorMessage(error, "Failed to delete customer"));
				}
			},
		});
	};

	const viewCustomerDetails = async (customerId: string) => {
		setLoadingCustomerId(customerId);
		try {
			const data = await customerAPI.getOne(customerId);
			setSelectedCustomer(data.customer);
		} catch (error) {
			notify("error", errorMessage(error, "Failed to load customer details"));
		} finally {
			setLoadingCustomerId(null);
		}
	};

	// ------------------------------------------------------------------
	// Restocking
	// ------------------------------------------------------------------
	const restockProduct = async (product: Product, input: RestockInput) => {
		try {
			await productAPI.restock(product.id, input);
			notify(
				"success",
				`Added ${input.quantity.toLocaleString()} unit${input.quantity === 1 ? "" : "s"} to ${product.name}`
			);
			refreshInBackground(loadProducts, loadDashboardStats);
			return true;
		} catch (error) {
			notify("error", errorMessage(error, "Failed to restock product"));
			return false;
		}
	};

	const receiveShipment = async (input: ShipmentInput) => {
		try {
			const result = await productAPI.receiveShipment(input);
			notify("success", result.message || "Shipment received");
			refreshInBackground(loadProducts, loadDashboardStats);
			return true;
		} catch (error) {
			notify("error", errorMessage(error, "Failed to receive shipment"));
			return false;
		}
	};

	const openShipment = (productIds: string[] = []) =>
		setShipment({ open: true, productIds });

	// ------------------------------------------------------------------
	// Sales
	// ------------------------------------------------------------------
	const addSale = async () => {
		if (!newSale.productId || !newSale.customerId || !newSale.quantity || !newSale.month) {
			notify("error", "All fields are required");
			return;
		}

		setSubmitting("sale");
		try {
			await salesAPI.create({
				productId: newSale.productId,
				customerId: newSale.customerId,
				quantity: parseInt(newSale.quantity),
				month: newSale.month,
			});
			// Keep the month so several sales can be entered in a row.
			setNewSale({ productId: "", customerId: "", quantity: "", month: newSale.month });
			notify("success", "Sale recorded");
			// Show the new stock level straight away; the refresh confirms it.
			const sold = parseInt(newSale.quantity);
			setProducts((list) =>
				list.map((p) =>
					p.id === newSale.productId ? { ...p, currentStock: p.currentStock - sold } : p
				)
			);
			refreshInBackground(
				loadSales,
				loadProducts,
				loadCustomers,
				loadDashboardStats,
				loadTopProducts,
				loadTopCustomers,
				loadRevenueTrends
			);
		} catch (error) {
			notify("error", errorMessage(error, "Failed to record sale"));
		} finally {
			setSubmitting(null);
		}
	};

	const deleteSale = (sale: Sale) => {
		setConfirm({
			title: "Delete this sale?",
			message: `${sale.quantity} × ${sale.product?.name ?? "item"} for ${
				sale.customer?.name ?? "customer"
			}. The quantity will be returned to stock.`,
			confirmLabel: "Delete sale",
			onConfirm: async () => {
				try {
					await salesAPI.delete(sale.id);
					notify("success", "Sale deleted");
					// Remove it from the list straight away; the refresh confirms it.
					setSales((list) => list.filter((s) => s.id !== sale.id));
					refreshInBackground(
						loadSales,
						loadProducts,
						loadCustomers,
						loadDashboardStats,
						loadTopProducts,
						loadTopCustomers,
						loadRevenueTrends
					);
				} catch (error) {
					notify("error", errorMessage(error, "Failed to delete sale"));
				}
			},
		});
	};

	const runConfirm = async () => {
		if (!confirm) return;
		setConfirmBusy(true);
		try {
			await confirm.onConfirm();
		} finally {
			setConfirmBusy(false);
			setConfirm(null);
		}
	};

	// ------------------------------------------------------------------
	// Export
	// ------------------------------------------------------------------
	const generateCsv = (): string => {
		let csv = "EADRACK TRADING - SALES AND INVENTORY REPORT\n\n";

		csv += "PRODUCTS INVENTORY\n";
		csv += csvRow(["Product Name", "Category", "Initial Stock", "Current Stock", "Unit Price (₦)", "% Sold"]);
		products.forEach((p) => {
			const sold = p.initialStock - p.currentStock;
			const pct = p.initialStock ? ((sold / p.initialStock) * 100).toFixed(2) : "0.00";
			csv += csvRow([p.name, p.category, p.initialStock, p.currentStock, p.price, `${pct}%`]);
		});

		csv += "\n\nMONTHLY SALES BREAKDOWN\n\n";
		MONTHS.forEach((month) => {
			const monthly = sales.filter((s) => s.month === month);
			if (monthly.length > 0) {
				csv += `${month.toUpperCase()}\n`;
				csv += csvRow(["Date", "Product", "Customer", "Quantity", "Unit Price (₦)", "Total Price (₦)"]);
				monthly.forEach((s) => {
					csv += csvRow([
						new Date(s.saleDate).toLocaleDateString(),
						s.product.name,
						s.customer.name,
						s.quantity,
						s.unitPrice,
						s.totalPrice,
					]);
				});
				csv += "\n";
			}
		});

		csv += "\n\nCUSTOMER RECORDS\n";
		csv += csvRow(["Customer Name", "Email", "Phone", "Total Purchases", "Total Spent (₦)"]);
		customers.forEach((c) => {
			csv += csvRow([c.name, c.email || "N/A", c.phone, c.totalPurchases || 0, c.totalSpent || 0]);
		});

		return csv;
	};

	const downloadCsv = () => {
		// BOM so Excel reads UTF-8 (the ₦ sign) correctly.
		const blob = new Blob(["﻿" + generateCsv()], { type: "text/csv;charset=utf-8" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "eadrack_trading_report.csv";
		a.click();
		window.URL.revokeObjectURL(url);
		notify("success", "Report downloaded");
	};

	// ------------------------------------------------------------------
	// Render
	// ------------------------------------------------------------------
	// Everything at or below its reorder level, including fully sold-out items.
	const needsRestock = products
		.filter((p) => p.currentStock <= p.reorderLevel)
		.sort((a, b) => a.currentStock - b.currentStock);
	const isAdmin = currentUser?.role === "ADMIN";

	const overlays = (
		<>
			<ConfirmDialog
				options={confirm}
				busy={confirmBusy}
				onCancel={() => setConfirm(null)}
				onConfirm={runConfirm}
			/>
			<Toaster toasts={toasts} onDismiss={dismissToast} />
		</>
	);

	if (!authChecked || (isAuthenticated && !hasLoaded)) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas">
				<BrandMark className="h-12 w-12 animate-pulse" />
				{authChecked && (
					<p className="text-sm text-ink-3">Loading your workspace…</p>
				)}
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<>
				<LoginScreen
					form={loginForm}
					onChange={setLoginForm}
					onSubmit={handleLogin}
					error={loginError}
					loading={isLoading}
				/>
				{overlays}
			</>
		);
	}

	return (
		<>
			<AppShell
				activeTab={activeTab}
				onNavigate={setActiveTab}
				user={currentUser}
				onLogout={handleLogout}
				onExport={downloadCsv}
				onRefresh={refreshAll}
				refreshing={refreshing}
				lowStockCount={needsRestock.length}
			>
				{activeTab === "dashboard" && (
					<DashboardView
						userName={currentUser?.fullName || ""}
						stats={dashboardStats}
						trends={revenueTrends}
						topProducts={topProducts}
						topCustomers={topCustomers}
						products={products}
						lowStockProducts={needsRestock}
						showLowStockAlert={lowStockAlert}
						onDismissLowStock={() => setLowStockAlert(false)}
						onNavigate={setActiveTab}
						isAdmin={isAdmin}
						onRestock={setRestockTarget}
						onRestockAll={() => openShipment(needsRestock.map((p) => p.id))}
					/>
				)}
				{activeTab === "sales" && (
					<SalesView
						sales={sales}
						products={products}
						customers={customers}
						isAdmin={isAdmin}
						newSale={newSale}
						onNewSaleChange={setNewSale}
						onAddSale={addSale}
						onDeleteSale={deleteSale}
						submitting={submitting === "sale"}
						selectedMonth={selectedMonth}
						onSelectedMonthChange={setSelectedMonth}
						onGoToCustomers={() => setActiveTab("customers")}
					/>
				)}
				{activeTab === "products" && (
					<ProductsView
						products={products}
						isAdmin={isAdmin}
						newProduct={newProduct}
						onNewProductChange={setNewProduct}
						onAddProduct={addProduct}
						onDeleteProduct={deleteProduct}
						onRestock={setRestockTarget}
						onReceiveShipment={() => openShipment()}
						submitting={submitting === "product"}
					/>
				)}
				{activeTab === "customers" && (
					<CustomersView
						customers={customers}
						isAdmin={isAdmin}
						newCustomer={newCustomer}
						onNewCustomerChange={setNewCustomer}
						onAddCustomer={addCustomer}
						onDeleteCustomer={deleteCustomer}
						onViewCustomer={viewCustomerDetails}
						searchTerm={searchTerm}
						onSearchTermChange={setSearchTerm}
						submitting={submitting === "customer"}
						loadingCustomerId={loadingCustomerId}
					/>
				)}
			</AppShell>
			<CustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
			<RestockModal
				product={restockTarget}
				onClose={() => setRestockTarget(null)}
				onSubmit={restockProduct}
			/>
			<ShipmentModal
				open={shipment.open}
				products={products}
				initialProductIds={shipment.productIds}
				onClose={() => setShipment({ open: false, productIds: [] })}
				onSubmit={receiveShipment}
			/>
			{overlays}
		</>
	);
};

export default EadrackApp;
