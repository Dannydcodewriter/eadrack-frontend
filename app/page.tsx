"use client";
import React, { useState, useEffect } from "react";
import {
	Download,
	Plus,
	Trash2,
	BarChart3,
	PieChart,
	TrendingUp,
	Save,
	RefreshCw,
	Eye,
	X,
	Search,
	Edit,
	Package,
	Users,
	ShoppingCart,
	LogOut,
	Lock,
} from "lucide-react";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Type Definitions
interface User {
	id: number;
	fullName: string;
	email: string;
	role: "ADMIN" | "USER";
	// Add other user properties as needed
}

interface Product {
	id: string;
	name: string;
	category: string;
	initialStock: number;
	currentStock: number;
	price: number;
	reorderLevel: number;
}

interface Customer {
	id: string;
	name: string;
	email: string;
	phone: string;
	totalPurchases?: number;
	totalSpent?: number;
	analytics?: {
		totalPurchases: number;
		totalSpent: number;
		totalItems: number;
		lastPurchase: string | null;
		productsPurchased: Array<{
			product: Product;
			quantity: number;
			total: number;
		}>;
		salesHistory: Array<{
			date: string;
			product: Product;
			month: string;
			quantity: number;
		}>;
	};
}

interface Sale {
	id: string;
	saleDate: string;
	product: Product;
	customer: Customer;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	month: string;
}

interface DashboardStats {
	totalRevenue: number;
	totalUnitsSold: number;
	totalCustomers: number;
}

interface TopProduct {
	product: Product;
	totalSold: number;
	totalRevenue: number;
}

interface TopCustomer {
	customer: Customer;
	totalSpent: number;
}

interface RevenueTrend {
	month: string;
	revenue: number;
}

// API Helper Functions
const apiCall = async <T,>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> => {
	const token = localStorage.getItem("token");

	const headers: HeadersInit = {
		"Content-Type": "application/json",
		...(token && { Authorization: `Bearer ${token}` }),
		...options.headers,
	};

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers,
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || "Request failed");
	}

	return data;
};

// Auth API
const authAPI = {
	login: (credentials: { email: string; password: string }) =>
		apiCall<{ token: string; user: User }>("/auth/login", {
			method: "POST",
			body: JSON.stringify(credentials),
		}),
	register: (userData: any) =>
		apiCall("/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
		}),
	getMe: () => apiCall<User>("/auth/me"),
	getAllUsers: () => apiCall<{ users: User[] }>("/auth/users"),
};

// Product API
const productAPI = {
	getAll: (params: Record<string, string | number> = {}) => {
		const query = new URLSearchParams(
			params as Record<string, string>
		).toString();
		return apiCall<{ products: Product[] }>(
			`/products${query ? "?" + query : ""}`
		);
	},
	getOne: (id: string) => apiCall<{ product: Product }>(`/products/${id}`),
	create: (data: Omit<Product, "id" | "currentStock">) =>
		apiCall<{ product: Product }>("/products", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	update: (id: string, data: Partial<Product>) =>
		apiCall<{ product: Product }>(`/products/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	delete: (id: string) =>
		apiCall(`/products/${id}`, {
			method: "DELETE",
		}),
	getLowStock: () => apiCall<{ products: Product[] }>("/products/low-stock"),
};

// Customer API
const customerAPI = {
	getAll: (params: Record<string, string | number> = {}) => {
		const query = new URLSearchParams(
			params as Record<string, string>
		).toString();
		return apiCall<{ customers: Customer[] }>(
			`/customers${query ? "?" + query : ""}`
		);
	},
	getOne: (id: string) => apiCall<{ customer: Customer }>(`/customers/${id}`),
	create: (
		data: Omit<Customer, "id" | "totalPurchases" | "totalSpent" | "analytics">
	) =>
		apiCall<{ customer: Customer }>("/customers", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	update: (id: string, data: Partial<Customer>) =>
		apiCall<{ customer: Customer }>(`/customers/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	delete: (id: string) =>
		apiCall(`/customers/${id}`, {
			method: "DELETE",
		}),
};

// Sales API
const salesAPI = {
	getAll: (params: Record<string, string | number> = {}) => {
		const query = new URLSearchParams(
			params as Record<string, string>
		).toString();
		return apiCall<{ sales: Sale[] }>(`/sales${query ? "?" + query : ""}`);
	},
	create: (
		data: Omit<
			Sale,
			"id" | "saleDate" | "unitPrice" | "totalPrice" | "product" | "customer"
		>
	) =>
		apiCall<{ sale: Sale }>("/sales", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	delete: (id: string) =>
		apiCall(`/sales/${id}`, {
			method: "DELETE",
		}),
	getMonthlySummary: () => apiCall("/sales/monthly-summary"),
};

// Analytics API
const analyticsAPI = {
	getDashboard: () => apiCall<DashboardStats>("/analytics/dashboard"),
	getTopProducts: (limit: number = 5) =>
		apiCall<{ topProducts: TopProduct[] }>(
			`/analytics/top-products?limit=${limit}`
		),
	getTopCustomers: (limit: number = 5) =>
		apiCall<{ topCustomers: TopCustomer[] }>(
			`/analytics/top-customers?limit=${limit}`
		),
	getRevenueTrends: () =>
		apiCall<{ trends: RevenueTrend[] }>(
			"/analytics/revenue-trends?period=monthly"
		),
};

const ExcelSalesReport = () => {
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	] as const;

	// Auth State
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loginForm, setLoginForm] = useState({ email: "", password: "" });
	const [loginError, setLoginError] = useState<string>("");

	// Data State
	const [selectedMonth, setSelectedMonth] = useState<string>("January");
	const [products, setProducts] = useState<Product[]>([]);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [sales, setSales] = useState<Sale[]>([]);
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
		null
	);
	const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
	const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
	const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);

	// Form State
	const [newProduct, setNewProduct] = useState({
		name: "",
		initialStock: "",
		price: "",
		category: "",
		reorderLevel: "10",
	});
	const [newCustomer, setNewCustomer] = useState({
		name: "",
		email: "",
		phone: "",
	});
	const [newSale, setNewSale] = useState({
		productId: "",
		customerId: "",
		quantity: "",
		month: "January",
	});

	// UI State
	const [activeTab, setActiveTab] = useState<string>("sales");
	const [saveStatus, setSaveStatus] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
		null
	);
	const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [lowStockAlert, setLowStockAlert] = useState<boolean>(true);
	const [error, setError] = useState<string>("");

	// Check if user is logged in on mount
	useEffect(() => {
		const token = localStorage.getItem("token");
		const user = localStorage.getItem("user");
		if (token && user) {
			setIsAuthenticated(true);
			setCurrentUser(JSON.parse(user));
			loadAllData();
		}
	}, []);

	// Load all data from backend
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
			setSaveStatus("✓ Data loaded");
			setTimeout(() => setSaveStatus(""), 2000);
		} catch (error) {
			console.error("Error loading data:", error);
			setError("Failed to load data. Please try again.");
			if (error instanceof Error && error.message.includes("token")) {
				handleLogout();
			}
		} finally {
			setIsLoading(false);
		}
	};

	const loadProducts = async () => {
		try {
			const data = await productAPI.getAll();
			setProducts(data.products);
		} catch (error) {
			console.error("Error loading products:", error);
		}
	};

	const loadCustomers = async () => {
		try {
			const data = await customerAPI.getAll();
			setCustomers(data.customers);
		} catch (error) {
			console.error("Error loading customers:", error);
		}
	};

	const loadSales = async () => {
		try {
			const data = await salesAPI.getAll();
			setSales(data.sales);
		} catch (error) {
			console.error("Error loading sales:", error);
		}
	};

	const loadDashboardStats = async () => {
		try {
			const data = await analyticsAPI.getDashboard();
			setDashboardStats(data);
		} catch (error) {
			console.error("Error loading dashboard stats:", error);
		}
	};

	const loadTopProducts = async () => {
		try {
			const data = await analyticsAPI.getTopProducts(5);
			setTopProducts(data.topProducts);
		} catch (error) {
			console.error("Error loading top products:", error);
		}
	};

	const loadTopCustomers = async () => {
		try {
			const data = await analyticsAPI.getTopCustomers(5);
			setTopCustomers(data.topCustomers);
		} catch (error) {
			console.error("Error loading top customers:", error);
		}
	};

	const loadRevenueTrends = async () => {
		try {
			const data = await analyticsAPI.getRevenueTrends();
			setRevenueTrends(data.trends);
		} catch (error) {
			console.error("Error loading revenue trends:", error);
		}
	};

	// Auth Functions
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
			await loadAllData();
		} catch (error) {
			setLoginError(error instanceof Error ? error.message : "Login failed");
		} finally {
			setIsLoading(false);
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
	};

	// Product Functions
	const addProduct = async () => {
		if (
			!newProduct.name ||
			!newProduct.initialStock ||
			!newProduct.price ||
			!newProduct.category
		) {
			setError("Please fill all required fields");
			return;
		}

		try {
			const productData = {
				name: newProduct.name,
				initialStock: parseInt(newProduct.initialStock),
				price: parseFloat(newProduct.price),
				category: newProduct.category,
				reorderLevel: parseInt(newProduct.reorderLevel),
			};
			await productAPI.create(productData);
			await loadProducts();
			await loadDashboardStats();
			setNewProduct({
				name: "",
				initialStock: "",
				price: "",
				category: "",
				reorderLevel: "10",
			});
			setSaveStatus("✓ Product added");
			setTimeout(() => setSaveStatus(""), 2000);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to add product"
			);
		}
	};

	const deleteProduct = async (productId: string) => {
		if (
			!window.confirm(
				"Delete this product? This will also remove all associated sales."
			)
		)
			return;

		try {
			await productAPI.delete(productId);
			await loadProducts();
			await loadSales();
			await loadDashboardStats();
			setSaveStatus("✓ Product deleted");
			setTimeout(() => setSaveStatus(""), 2000);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to delete product"
			);
		}
	};

	// Customer Functions
	const addCustomer = async () => {
		if (!newCustomer.name || !newCustomer.phone) {
			setError("Name and phone are required");
			return;
		}

		try {
			const customerData = {
				name: newCustomer.name,
				email: newCustomer.email,
				phone: newCustomer.phone,
			};
			await customerAPI.create(customerData);
			await loadCustomers();
			setNewCustomer({ name: "", email: "", phone: "" });
			setSaveStatus("✓ Customer added");
			setTimeout(() => setSaveStatus(""), 2000);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to add customer"
			);
		}
	};

	const deleteCustomer = async (customerId: string) => {
		if (!window.confirm("Delete this customer?")) return;

		try {
			await customerAPI.delete(customerId);
			await loadCustomers();
			setSaveStatus("✓ Customer deleted");
			setTimeout(() => setSaveStatus(""), 2000);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to delete customer"
			);
		}
	};

	const viewCustomerDetails = async (customerId: string) => {
		try {
			const data = await customerAPI.getOne(customerId);
			setSelectedCustomer(data.customer);
			setShowCustomerModal(true);
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Failed to load customer details"
			);
		}
	};

	// Sales Functions
	const addSale = async () => {
		if (
			!newSale.productId ||
			!newSale.customerId ||
			!newSale.quantity ||
			!newSale.month
		) {
			setError("All fields are required");
			return;
		}

		try {
			const saleData = {
				productId: newSale.productId,
				customerId: newSale.customerId,
				quantity: parseInt(newSale.quantity),
				month: newSale.month,
			};
			await salesAPI.create(saleData);
			await loadSales();
			await loadProducts();
			await loadDashboardStats();
			await loadTopProducts();
			await loadTopCustomers();
			setNewSale({
				productId: "",
				customerId: "",
				quantity: "",
				month: selectedMonth,
			});
			setSaveStatus("✓ Sale recorded");
			setTimeout(() => setSaveStatus(""), 2000);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to record sale"
			);
		}
	};

	const deleteSale = async (saleId: string) => {
		if (!window.confirm("Delete this sale record?")) return;

		try {
			await salesAPI.delete(saleId);
			await loadSales();
			await loadProducts();
			await loadDashboardStats();
			setSaveStatus("✓ Sale deleted");
			setTimeout(() => setSaveStatus(""), 2000);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to delete sale"
			);
		}
	};

	// Helper Functions
	const getSalesForMonth = (month: string): Sale[] => {
		return sales.filter((sale) => sale.month === month);
	};

	const getRemainingStock = (productId: string): number => {
		const product = products.find((p) => p.id === productId);
		return product ? product.currentStock : 0;
	};

	const getMonthlyStats = (month: string) => {
		const monthlySales = getSalesForMonth(month);
		const totalRevenue = monthlySales.reduce(
			(sum, sale) => sum + sale.totalPrice,
			0
		);
		const totalQuantity = monthlySales.reduce(
			(sum, sale) => sum + sale.quantity,
			0
		);
		return { totalRevenue, totalQuantity, salesCount: monthlySales.length };
	};

	const getLowStockProducts = (): Product[] => {
		return products.filter(
			(product) =>
				product.currentStock <= product.reorderLevel && product.currentStock > 0
		);
	};

	const filteredCustomers = customers.filter(
		(customer) =>
			customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(customer.email &&
				customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
			customer.phone.includes(searchTerm)
	);

	const generateExcelData = (): string => {
		let csvContent = "EADRACK TRADING - SALES AND INVENTORY REPORT\n\n";

		csvContent += "PRODUCTS INVENTORY\n";
		csvContent +=
			"Product Name,Category,Initial Stock,Current Stock,Unit Price (₦),% Sold\n";
		products.forEach((product) => {
			const sold = product.initialStock - product.currentStock;
			const percentSold = ((sold / product.initialStock) * 100).toFixed(2);
			csvContent += `${product.name},${product.category},${product.initialStock},${product.currentStock},${product.price},${percentSold}%\n`;
		});

		csvContent += "\n\nMONTHLY SALES BREAKDOWN\n\n";
		months.forEach((month) => {
			const monthlySales = getSalesForMonth(month);
			if (monthlySales.length > 0) {
				csvContent += `${month.toUpperCase()}\n`;
				csvContent +=
					"Date,Product,Customer,Quantity,Unit Price (₦),Total Price (₦)\n";
				monthlySales.forEach((sale) => {
					csvContent += `${new Date(sale.saleDate).toLocaleDateString()},${
						sale.product.name
					},${sale.customer.name},${sale.quantity},${sale.unitPrice},${
						sale.totalPrice
					}\n`;
				});
				csvContent += `\n`;
			}
		});

		csvContent += "\n\nCUSTOMER RECORDS\n";
		csvContent += "Customer Name,Email,Phone,Total Purchases,Total Spent (₦)\n";
		customers.forEach((customer) => {
			csvContent += `${customer.name},${customer.email || "N/A"},${
				customer.phone
			},${customer.totalPurchases || 0},${customer.totalSpent || 0}\n`;
		});

		return csvContent;
	};

	const downloadExcel = () => {
		const csvContent = generateExcelData();
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "eadrack_trading_report.csv";
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const lowStockProducts = getLowStockProducts();

	// Login Screen
	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full pt-10 pb-10">
					<div className="text-center mb-8">
						<div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
							<Lock size={32} />
						</div>
						<h1 className="text-2xl font-bold text-gray-800">
							Eadrack Trading
						</h1>
						<p className="text-gray-600 mt-2">Sales & Inventory System</p>
					</div>

					<form onSubmit={handleLogin}>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email Address
								</label>
								<input
									type="email"
									value={loginForm.email}
									onChange={(e) =>
										setLoginForm({ ...loginForm, email: e.target.value })
									}
									className="w-full p-3 border text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Email Address"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Password
								</label>
								<input
									type="password"
									value={loginForm.password}
									onChange={(e) =>
										setLoginForm({ ...loginForm, password: e.target.value })
									}
									className="w-full p-3 text-black border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="••••••••"
									required
								/>
							</div>

							{loginError && (
								<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
									{loginError}
								</div>
							)}

							<button
								type="submit"
								disabled={isLoading}
								className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isLoading ? (
									<>
										<RefreshCw className="animate-spin" size={20} />
										Logging in...
									</>
								) : (
									"Login"
								)}
							</button>
						</div>
					</form>

					{/* <div className="mt-6 p-4 bg-gray-50 rounded-lg">
						<p className="text-xs text-gray-600 text-center">
							Demo: admin@eadrack.com / admin123
						</p>
					</div> */}
				</div>
			</div>
		);
	}

	// Loading Screen
	if (isLoading && products.length === 0) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="text-center">
					<RefreshCw className="animate-spin mx-auto mb-4" size={48} />
					<p className="text-xl">Loading your data...</p>
				</div>
			</div>
		);
	}

	// Main App
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
			<div className="max-w-7xl mx-auto">
				<div className="bg-white rounded-lg shadow-xl p-3 sm:p-4 lg:p-6 mb-4 lg:mb-6">
					{/* Header */}
					<div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6 gap-4">
						<div>
							<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
								Eadrack Trading Sales & Inventory 2026
							</h1>
							<p className="text-sm text-gray-600 mt-1">
								Welcome, {currentUser?.fullName} ({currentUser?.role})
							</p>
							{saveStatus && (
								<p className="text-xs sm:text-sm text-green-600 mt-1 flex items-center gap-1">
									<Save size={14} /> {saveStatus}
								</p>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							<button
								onClick={handleLogout}
								className="flex items-center gap-1 sm:gap-2 bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition text-xs sm:text-sm"
							>
								<LogOut size={16} />
								<span className="hidden sm:inline">Logout</span>
							</button>
							<button
								onClick={downloadExcel}
								className="flex items-center gap-1 sm:gap-2 bg-green-600 text-white px-3 sm:px-6 py-2 rounded-lg hover:bg-green-700 transition text-xs sm:text-sm"
							>
								<Download size={18} />
								<span className="hidden sm:inline">Export</span>
							</button>
						</div>
					</div>
					{/* Error Message */}
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
							<span>{error}</span>
							<button onClick={() => setError("")} className="text-red-700">
								<X size={18} />
							</button>
						</div>
					)}
					{/* Low Stock Alert */}
					{lowStockAlert && lowStockProducts.length > 0 && (
						<div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded relative">
							<button
								onClick={() => setLowStockAlert(false)}
								className="absolute top-2 right-2 text-yellow-600 hover:text-yellow-800"
							>
								<X size={16} />
							</button>
							<p className="text-sm text-yellow-800 font-semibold">
								⚠️ Low Stock Alert: {lowStockProducts.length} product(s) running
								low
							</p>
							<div className="text-xs text-yellow-700 mt-1">
								{lowStockProducts
									.map((p) => `${p.name} (${p.currentStock} left)`)
									.join(", ")}
							</div>
						</div>
					)}
					{/* Tabs */}
					<div className="flex gap-1 sm:gap-2 mb-4 lg:mb-6 border-b overflow-x-auto">
						{["sales", "products", "customers", "analytics"].map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`px-3 sm:px-6 py-2 sm:py-3 font-medium capitalize whitespace-nowrap text-xs sm:text-base ${
									activeTab === tab
										? "border-b-2 border-blue-600 text-blue-600"
										: "text-gray-600 hover:text-gray-800"
								}`}
							>
								{tab}
							</button>
						))}
					</div>
					{/* Sales Tab */}
					{/* {activeTab === "sales" && (
						<div>
							<div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 lg:mb-6">
								<h2 className="text-lg sm:text-xl text-black font-semibold mb-3 sm:mb-4">
									Record New Sale
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
									<select
										value={newSale.month}
										onChange={(e) =>
											setNewSale({ ...newSale, month: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										{months.map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</select>
									<select
										value={newSale.productId}
										onChange={(e) =>
											setNewSale({ ...newSale, productId: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="">Select Product</option>
										{products.map((p) => (
											<option key={p.id} value={p.id}>
												{p.name} (Stock: {p.currentStock})
											</option>
										))}
									</select>
									<select
										value={newSale.customerId}
										onChange={(e) =>
											setNewSale({ ...newSale, customerId: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="">Select Customer</option>
										{customers.map((c) => (
											<option key={c.id} value={c.id}>
												{c.name}
											</option>
										))}
									</select>
									<input
										type="number"
										placeholder="Quantity"
										value={newSale.quantity}
										onChange={(e) =>
											setNewSale({ ...newSale, quantity: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									/>
								</div>
								<button
									onClick={addSale}
									className="mt-3 sm:mt-4 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
								>
									<Plus size={18} /> Add Sale
								</button>
							</div>

							<div className="mb-4">
								<label className="font-semibold text-black mr-4 text-sm">
									View Month:
								</label>
								<select
									value={selectedMonth}
									onChange={(e) => setSelectedMonth(e.target.value)}
									className="p-2 border text-black rounded text-sm"
								>
									{months.map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
							</div>

							<div className="overflow-x-auto -mx-3 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<table className="min-w-full border-collapse text-sm">
										<thead>
											<tr className="bg-gray-100">
												<th className="border p-2 text-black text-left">
													Date
												</th>
												<th className="border p-2 text-black text-left">
													Product
												</th>
												<th className="border p-2 text-black text-left">
													Customer
												</th>
												<th className="border p-2 text-black text-right">
													Qty
												</th>
												<th className="border p-2 text-black text-right">
													Price
												</th>
												<th className="border p-2 text-black text-right">
													Total
												</th>
												{currentUser?.role === "ADMIN" && (
													<th className="border p-2 text-black text-center">
														Action
													</th>
												)}
											</tr>
										</thead>
										<tbody>
											{getSalesForMonth(selectedMonth).map((sale) => (
												<tr key={sale.id} className="hover:bg-gray-50">
													<td className="border p-2 text-xs">
														{new Date(sale.saleDate).toLocaleDateString()}
													</td>
													<td className="border p-2 text-xs">
														{sale.product.name}
													</td>
													<td className="border p-2 text-xs">
														{sale.customer.name}
													</td>
													<td className="border p-2 text-right text-xs">
														{sale.quantity}
													</td>
													<td className="border p-2 text-right text-xs">
														₦{sale.unitPrice.toLocaleString()}
													</td>
													<td className="border p-2 text-right text-xs">
														₦{sale.totalPrice.toLocaleString()}
													</td>
													{currentUser?.role === "ADMIN" && (
														<td className="border p-2 text-center">
															<button
																onClick={() => deleteSale(sale.id)}
																className="text-red-600 hover:text-red-800"
															>
																<Trash2 size={14} />
															</button>
														</td>
													)}
												</tr>
											))}
										</tbody>
										<tfoot>
											<tr className="bg-gray-100 font-bold">
												<td
													colSpan={currentUser?.role === "ADMIN" ? "5" : "5"}
													className="border text-black p-2 text-right text-xs sm:text-sm"
												>
													Total Revenue:
												</td>
												<td className="border text-black p-2 text-right text-xs sm:text-sm">
													₦
													{getMonthlyStats(
														selectedMonth
													).totalRevenue.toLocaleString()}
												</td>
												{currentUser?.role === "ADMIN" && (
													<td className="border"></td>
												)}
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						</div>
					)} */}
					{/* Sales Tab */}
					{/* Sales Tab */}
					{/* {activeTab === "sales" && (
						<div>
							<div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 lg:mb-6">
								<h2 className="text-lg sm:text-xl text-black font-semibold mb-3 sm:mb-4">
									Record New Sale
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
									<select
										value={newSale.month}
										onChange={(e) =>
											setNewSale({ ...newSale, month: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										{months.map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</select>
									<select
										value={newSale.productId}
										onChange={(e) =>
											setNewSale({ ...newSale, productId: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="">Select Product</option>
										{products.map((p) => (
											<option key={p.id} value={p.id}>
												{p.name} (Stock: {p.currentStock})
											</option>
										))}
									</select>
									<select
										value={newSale.customerId}
										onChange={(e) =>
											setNewSale({ ...newSale, customerId: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="">Select Customer</option>
										{customers.map((c) => (
											<option key={c.id} value={c.id}>
												{c.name}
											</option>
										))}
									</select>
									<input
										type="number"
										placeholder="Quantity"
										value={newSale.quantity}
										onChange={(e) =>
											setNewSale({ ...newSale, quantity: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									/>
								</div>
								<button
									onClick={addSale}
									className="mt-3 sm:mt-4 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
								>
									<Plus size={18} /> Add Sale
								</button>
							</div>

							<div className="mb-4 flex items-center gap-4">
								<div>
									<label className="font-semibold text-black mr-2 text-sm">
										View Month:
									</label>
									<select
										value={selectedMonth}
										onChange={(e) => setSelectedMonth(e.target.value)}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="All">All Months</option>
										{months.map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</select>
								</div>
								<span className="text-sm text-gray-600">
									{(() => {
										const filteredSales =
											selectedMonth === "All"
												? sales
												: sales.filter((s) => s.month === selectedMonth);
										return `Showing ${filteredSales.length} sale(s)`;
									})()}
								</span>
							</div>

							<div className="overflow-x-auto -mx-3 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<table className="min-w-full border-collapse text-sm">
										<thead>
											<tr className="bg-gray-100">
												<th className="border p-2 text-black text-left">
													Date
												</th>
												{selectedMonth === "All" && (
													<th className="border p-2 text-black text-left">
														Month
													</th>
												)}
												<th className="border p-2 text-black text-left">
													Product
												</th>
												<th className="border p-2 text-black text-left">
													Customer
												</th>
												<th className="border p-2 text-black text-right">
													Qty
												</th>
												<th className="border p-2 text-black text-right">
													Price
												</th>
												<th className="border p-2 text-black text-right">
													Total
												</th>
												{currentUser?.role === "ADMIN" && (
													<th className="border p-2 text-black text-center">
														Action
													</th>
												)}
											</tr>
										</thead>
										<tbody>
											{(() => {
												const filteredSales =
													selectedMonth === "All"
														? [...sales].sort(
																(a, b) =>
																	new Date(b.saleDate).getTime() -
																	new Date(a.saleDate).getTime()
														  )
														: sales.filter((s) => s.month === selectedMonth);

												if (filteredSales.length === 0) {
													return (
														<tr>
															<td
																colSpan={
																	selectedMonth === "All"
																		? currentUser?.role === "ADMIN"
																			? 8
																			: 7
																		: currentUser?.role === "ADMIN"
																		? 7
																		: 6
																}
																className="border p-4 text-black text-center text-gray-500"
															>
																No sales found
																{selectedMonth !== "All" &&
																	` for ${selectedMonth}`}
															</td>
														</tr>
													);
												}

												return filteredSales.map((sale) => (
													<tr key={sale.id} className="hover:bg-gray-50">
														<td className="border text-black p-2 text-xs">
															{new Date(sale.saleDate).toLocaleDateString()}
														</td>
														{selectedMonth === "All" && (
															<td className="border text-black p-2 text-xs">
																{sale.month}
															</td>
														)}
														<td className="border text-black p-2 text-xs">
															{sale.product.name}
														</td>
														<td className="border text-black p-2 text-xs">
															{sale.customer.name}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															{sale.quantity}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															₦{sale.unitPrice.toLocaleString()}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															₦{sale.totalPrice.toLocaleString()}
														</td>
														{currentUser?.role === "ADMIN" && (
															<td className="border text-black p-2 text-center">
																<button
																	onClick={() => deleteSale(sale.id)}
																	className="text-red-600 hover:text-red-800"
																>
																	<Trash2 size={14} />
																</button>
															</td>
														)}
													</tr>
												));
											})()}
										</tbody>
										<tfoot>
											<tr className="bg-gray-100 font-bold">
												<td
													colSpan={
														selectedMonth === "All"
															? currentUser?.role === "ADMIN"
																? 6
																: 6
															: currentUser?.role === "ADMIN"
															? 5
															: 5
													}
													className="border text-black p-2 text-right text-xs sm:text-sm"
												>
													Total Revenue:
												</td>
												<td className="border text-black p-2 text-right text-xs sm:text-sm">
													₦
													{(() => {
														const filteredSales =
															selectedMonth === "All"
																? sales
																: sales.filter(
																		(s) => s.month === selectedMonth
																  );
														return filteredSales
															.reduce((sum, sale) => sum + sale.totalPrice, 0)
															.toLocaleString();
													})()}
												</td>
												{currentUser?.role === "ADMIN" && (
													<td className="border"></td>
												)}
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						</div>
					)} */}
					{/* Sales Tab */}
					{activeTab === "sales" && (
						<div>
							<div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 lg:mb-6">
								<h2 className="text-lg sm:text-xl text-black font-semibold mb-3 sm:mb-4">
									Record New Sale
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
									<select
										value={newSale.month}
										onChange={(e) =>
											setNewSale({ ...newSale, month: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										{months.map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</select>
									<select
										value={newSale.productId}
										onChange={(e) =>
											setNewSale({ ...newSale, productId: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="">Select Product</option>
										{products.map((p) => (
											<option key={p.id} value={p.id}>
												{p.name} (Stock: {p.currentStock})
											</option>
										))}
									</select>
									<select
										value={newSale.customerId}
										onChange={(e) =>
											setNewSale({ ...newSale, customerId: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="">Select Customer</option>
										{customers.map((c) => (
											<option key={c.id} value={c.id}>
												{c.name}
											</option>
										))}
									</select>
									<input
										type="number"
										placeholder="Quantity"
										value={newSale.quantity}
										onChange={(e) =>
											setNewSale({ ...newSale, quantity: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									/>
								</div>
								<button
									onClick={addSale}
									className="mt-3 sm:mt-4 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
								>
									<Plus size={18} /> Add Sale
								</button>
							</div>

							<div className="mb-4 flex items-center gap-4">
								<div>
									<label className="font-semibold text-black mr-2 text-sm">
										View Month:
									</label>
									<select
										value={selectedMonth}
										onChange={(e) => setSelectedMonth(e.target.value)}
										className="p-2 border text-black rounded text-sm"
									>
										<option value="All">All Months</option>
										{months.map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</select>
								</div>
								<span className="text-sm text-gray-600">
									{(() => {
										// FIX: Filter out invalid month values
										const validMonths = [...months, "All"];
										const filteredSales =
											selectedMonth === "All"
												? sales.filter((s) => validMonths.includes(s.month))
												: sales.filter((s) => s.month === selectedMonth);
										return `Showing ${filteredSales.length} sale(s)`;
									})()}
								</span>
							</div>

							<div className="overflow-x-auto -mx-3 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<table className="min-w-full border-collapse text-sm">
										<thead>
											<tr className="bg-gray-100">
												<th className="border p-2 text-black text-left">
													Date
												</th>
												{selectedMonth === "All" && (
													<th className="border p-2 text-black text-left">
														Month
													</th>
												)}
												<th className="border p-2 text-black text-left">
													Product
												</th>
												<th className="border p-2 text-black text-left">
													Customer
												</th>
												<th className="border p-2 text-black text-right">
													Qty
												</th>
												<th className="border p-2 text-black text-right">
													Price
												</th>
												<th className="border p-2 text-black text-right">
													Total
												</th>
												{currentUser?.role === "ADMIN" && (
													<th className="border p-2 text-black text-center">
														Action
													</th>
												)}
											</tr>
										</thead>
										<tbody>
											{(() => {
												// FIX: Filter out sales with invalid month values
												const validMonths = [...months];
												const filteredSales =
													selectedMonth === "All"
														? [...sales]
																.filter((s) =>
																	validMonths.includes(s.month as any)
																)
																.sort(
																	(a, b) =>
																		new Date(b.saleDate).getTime() -
																		new Date(a.saleDate).getTime()
																)
														: sales.filter((s) => s.month === selectedMonth);

												if (filteredSales.length === 0) {
													return (
														<tr>
															<td
																colSpan={
																	selectedMonth === "All"
																		? currentUser?.role === "ADMIN"
																			? 8
																			: 7
																		: currentUser?.role === "ADMIN"
																		? 7
																		: 6
																}
																className="border p-4 text-black text-center text-gray-500"
															>
																No sales found
																{selectedMonth !== "All" &&
																	` for ${selectedMonth}`}
															</td>
														</tr>
													);
												}

												return filteredSales.map((sale) => (
													<tr key={sale.id} className="hover:bg-gray-50">
														<td className="border text-black p-2 text-xs">
															{new Date(sale.saleDate).toLocaleDateString()}
														</td>
														{selectedMonth === "All" && (
															<td className="border text-black p-2 text-xs">
																{sale.month}
															</td>
														)}
														<td className="border text-black p-2 text-xs">
															{sale.product.name}
														</td>
														<td className="border text-black p-2 text-xs">
															{sale.customer.name}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															{sale.quantity}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															₦{sale.unitPrice.toLocaleString()}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															₦{sale.totalPrice.toLocaleString()}
														</td>
														{currentUser?.role === "ADMIN" && (
															<td className="border text-black p-2 text-center">
																<button
																	onClick={() => deleteSale(sale.id)}
																	className="text-red-600 hover:text-red-800"
																>
																	<Trash2 size={14} />
																</button>
															</td>
														)}
													</tr>
												));
											})()}
										</tbody>
										<tfoot>
											<tr className="bg-gray-100 font-bold">
												<td
													colSpan={
														selectedMonth === "All"
															? currentUser?.role === "ADMIN"
																? 6
																: 6
															: currentUser?.role === "ADMIN"
															? 5
															: 5
													}
													className="border text-black p-2 text-right text-xs sm:text-sm"
												>
													Total Revenue:
												</td>
												<td className="border text-black p-2 text-right text-xs sm:text-sm">
													₦
													{(() => {
														// FIX: Only calculate revenue for valid months
														const validMonths = [...months];
														const filteredSales =
															selectedMonth === "All"
																? sales.filter((s) =>
																		validMonths.includes(s.month as any)
																  )
																: sales.filter(
																		(s) => s.month === selectedMonth
																  );
														return filteredSales
															.reduce((sum, sale) => sum + sale.totalPrice, 0)
															.toLocaleString();
													})()}
												</td>
												{currentUser?.role === "ADMIN" && (
													<td className="border"></td>
												)}
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						</div>
					)}
					{/* Products Tab */}
					{activeTab === "products" && (
						<div>
							{currentUser?.role === "ADMIN" && (
								<div className="bg-green-50 p-3 sm:p-4 rounded-lg mb-4 lg:mb-6">
									<h2 className="text-lg sm:text-xl text-black font-semibold mb-3 sm:mb-4">
										Add New Product
									</h2>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
										<input
											type="text"
											placeholder="Product Name"
											value={newProduct.name}
											onChange={(e) =>
												setNewProduct({ ...newProduct, name: e.target.value })
											}
											className="p-2 text-black border rounded text-sm"
										/>
										<input
											type="text"
											placeholder="Category"
											value={newProduct.category}
											onChange={(e) =>
												setNewProduct({
													...newProduct,
													category: e.target.value,
												})
											}
											className="p-2 text-black border rounded text-sm"
										/>
										<input
											type="number"
											placeholder="Initial Stock"
											value={newProduct.initialStock}
											onChange={(e) =>
												setNewProduct({
													...newProduct,
													initialStock: e.target.value,
												})
											}
											className="p-2 text-black border rounded text-sm"
										/>
										<input
											type="number"
											placeholder="Price (₦)"
											value={newProduct.price}
											onChange={(e) =>
												setNewProduct({ ...newProduct, price: e.target.value })
											}
											className="p-2 text-black border rounded text-sm"
										/>
										<button
											onClick={addProduct}
											className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
										>
											<Plus size={18} /> Add
										</button>
									</div>
								</div>
							)}

							<div className="overflow-x-auto -mx-3 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<table className="min-w-full border-collapse text-sm">
										<thead>
											<tr className="bg-gray-100">
												<th className="border text-black p-2 text-left">
													Name
												</th>
												<th className="border text-black p-2 text-left">
													Category
												</th>
												<th className="border text-black p-2 text-right">
													Stock
												</th>
												<th className="border text-black p-2 text-right">
													Price
												</th>
												<th className="border text-black p-2 text-right">
													% Sold
												</th>
												{currentUser?.role === "ADMIN" && (
													<th className="border text-black p-2 text-center">
														Action
													</th>
												)}
											</tr>
										</thead>
										<tbody>
											{products.map((product) => {
												const sold =
													product.initialStock - product.currentStock;
												const percentSold = (
													(sold / product.initialStock) *
													100
												).toFixed(2);
												return (
													<tr key={product.id} className="hover:bg-gray-50">
														<td className="border text-black p-2 text-xs">
															{product.name}
														</td>
														<td className="border text-black p-2 text-xs">
															{product.category}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															{product.currentStock}
														</td>
														<td className="border text-black p-2 text-right text-xs">
															₦{product.price.toLocaleString()}
														</td>
														<td className="border text-black p-2 text-right">
															<span
																className={`px-2 py-1 rounded text-xs ${
																	Number(percentSold) > 75
																		? "bg-red-100 text-red-800"
																		: Number(percentSold) > 50
																		? "bg-yellow-100 text-yellow-800"
																		: "bg-green-100 text-green-800"
																}`}
															>
																{percentSold}%
															</span>
														</td>
														{currentUser?.role === "ADMIN" && (
															<td className="border p-2 text-center">
																<button
																	onClick={() => deleteProduct(product.id)}
																	className="text-red-600 hover:text-red-800"
																>
																	<Trash2 size={14} />
																</button>
															</td>
														)}
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}
					{/* Customers Tab */}
					{activeTab === "customers" && (
						<div>
							<div className="bg-purple-50 p-3 sm:p-4 rounded-lg mb-4 lg:mb-6">
								<h2 className="text-lg sm:text-xl text-black font-semibold mb-3 sm:mb-4">
									Add New Customer
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
									<input
										type="text"
										placeholder="Customer Name"
										value={newCustomer.name}
										onChange={(e) =>
											setNewCustomer({ ...newCustomer, name: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									/>
									<input
										type="email"
										placeholder="Email"
										value={newCustomer.email}
										onChange={(e) =>
											setNewCustomer({ ...newCustomer, email: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									/>
									<input
										type="tel"
										placeholder="Phone"
										value={newCustomer.phone}
										onChange={(e) =>
											setNewCustomer({ ...newCustomer, phone: e.target.value })
										}
										className="p-2 border text-black rounded text-sm"
									/>
									<button
										onClick={addCustomer}
										className="bg-purple-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-purple-700 flex items-center justify-center gap-2 text-sm"
									>
										<Plus size={18} /> Add
									</button>
								</div>
							</div>

							<div className="mb-4">
								<div className="relative">
									<Search
										className="absolute text left-3 top-2.5 text-gray-400"
										size={18}
									/>
									<input
										type="text"
										placeholder="Search customers..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="w-full pl-10 p-2 text-black border rounded text-sm"
									/>
								</div>
							</div>

							<div className="overflow-x-auto -mx-3 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<table className="min-w-full border-collapse text-sm">
										<thead>
											<tr className="bg-gray-100">
												<th className="border text-black p-2 text-left">
													Name
												</th>
												<th className="border text-black p-2 text-left hidden sm:table-cell">
													Email
												</th>
												<th className="border text-black p-2 text-left">
													Phone
												</th>
												<th className="border text-black p-2 text-right">
													Purchases
												</th>
												<th className="border text-black p-2 text-right">
													Total Spent
												</th>
												<th className="border text-black p-2 text-center">
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{filteredCustomers.map((customer) => (
												<tr key={customer.id} className="hover:bg-gray-50">
													<td className="border text-black p-2 text-xs">
														{customer.name}
													</td>
													<td className="border text-black p-2 text-xs hidden sm:table-cell">
														{customer.email || "N/A"}
													</td>
													<td className="border text-black p-2 text-xs">
														{customer.phone}
													</td>
													<td className="border text-black p-2 text-right text-xs">
														{customer.totalPurchases || 0}
													</td>
													<td className="border text-black p-2 text-right text-xs">
														₦{(customer.totalSpent || 0).toLocaleString()}
													</td>
													<td className="border text-black p-2 text-center">
														<div className="flex justify-center gap-2">
															<button
																onClick={() => viewCustomerDetails(customer.id)}
																className="text-blue-600 hover:text-blue-800"
																title="View Details"
															>
																<Eye size={14} />
															</button>
															{currentUser?.role === "ADMIN" && (
																<button
																	onClick={() => deleteCustomer(customer.id)}
																	className="text-red-600 hover:text-red-800"
																	title="Delete"
																>
																	<Trash2 size={14} />
																</button>
															)}
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}
					{/* Analytics Tab */}
					{activeTab === "analytics" && (
						<div className="space-y-4 lg:space-y-6">
							<div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 rounded-lg">
								<h2 className="text-xl sm:text-2xl font-bold mb-4">
									Business Overview
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div>
										<p className="text-xs sm:text-sm opacity-80">
											Total Revenue
										</p>
										<p className="text-2xl sm:text-3xl font-bold">
											₦{(dashboardStats?.totalRevenue || 0).toLocaleString()}
										</p>
									</div>
									<div>
										<p className="text-xs sm:text-sm opacity-80">
											Total Units Sold
										</p>
										<p className="text-2xl sm:text-3xl font-bold">
											{(dashboardStats?.totalUnitsSold || 0).toLocaleString()}
										</p>
									</div>
									<div>
										<p className="text-xs sm:text-sm opacity-80">
											Total Customers
										</p>
										<p className="text-2xl sm:text-3xl font-bold">
											{dashboardStats?.totalCustomers || 0}
										</p>
									</div>
								</div>
							</div>

							{/* Top Customers */}
							<div className="bg-white border rounded-lg p-4">
								<h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
									<Users className="text-purple-600" size={20} />
									Top 5 Customers
								</h3>
								<div className="space-y-2">
									{topCustomers.map((item, index) => (
										<div
											key={item.customer.id}
											className="flex justify-between items-center p-2 bg-gray-50 rounded"
										>
											<div className="flex items-center gap-2">
												<span className="font-bold text-black text-gray-400">
													#{index + 1}
												</span>
												<span className="text-sm text-black font-medium">
													{item.customer.name}
												</span>
											</div>
											<span className="text-sm font-semibold text-purple-600">
												₦{item.totalSpent.toLocaleString()}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Top Products */}
							<div className="bg-white border rounded-lg p-4">
								<h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
									<Package className="text-green-600" size={20} />
									Top 5 Products by Revenue
								</h3>
								<div className="space-y-2">
									{topProducts.map((item, index) => (
										<div
											key={item.product.id}
											className="flex justify-between items-center p-2 bg-gray-50 rounded"
										>
											<div className="flex items-center gap-2">
												<span className="font-bold text-black text-gray-400">
													#{index + 1}
												</span>
												<div>
													<span className="text-sm text-black font-medium block">
														{item.product.name}
													</span>
													<span className="text-xs text-gray-500">
														{item.totalSold} units sold
													</span>
												</div>
											</div>
											<span className="text-sm font-semibold text-green-600">
												₦{item.totalRevenue.toLocaleString()}
											</span>
										</div>
									))}
								</div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
								<div className="bg-white border rounded-lg p-4">
									<h3 className="text-base sm:text-lg font-semibold text-black mb-4 flex items-center gap-2">
										<TrendingUp className="text-blue-600" size={20} />
										Monthly Revenue Trend
									</h3>
									<div className="space-y-2">
										{revenueTrends.map((data) => {
											const maxRevenue = Math.max(
												...revenueTrends.map((m) => m.revenue),
												1
											);
											return (
												<div key={data.month}>
													<div className="flex text-black justify-between text-xs sm:text-sm mb-1">
														<span>{data.month}</span>
														<span className="font-semibold">
															₦{data.revenue.toLocaleString()}
														</span>
													</div>
													<div className="bg-gray-200 rounded-full h-2">
														<div
															className="bg-blue-600 h-2 rounded-full transition-all"
															style={{
																width: `${(data.revenue / maxRevenue) * 100}%`,
															}}
														/>
													</div>
												</div>
											);
										})}
									</div>
								</div>

								<div className="bg-white border rounded-lg p-4">
									<h3 className="text-base sm:text-lg text-black font-semibold mb-4 flex items-center gap-2">
										<PieChart className="text-green-600" size={20} />
										Product Stock Status
									</h3>
									<div className="space-y-2">
										{products.slice(0, 5).map((product) => {
											const sold = product.initialStock - product.currentStock;
											const percentage = (
												(sold / product.initialStock) *
												100
											).toFixed(1);
											return (
												<div key={product.id}>
													<div className="flex text-black justify-between text-xs sm:text-sm mb-1">
														<span>{product.name}</span>
														<span className="font-semibold">
															{sold} sold ({percentage}%)
														</span>
													</div>
													<div className="bg-gray-200 rounded-full h-2">
														<div
															className="bg-green-600 h-2 rounded-full transition-all"
															style={{ width: `${percentage}%` }}
														/>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			{/* Customer Details Modal */}
			{/* {showCustomerModal && selectedCustomer && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
							<h2 className="text-xl font-bold text-black">Customer Details</h2>
							<button
								onClick={() => setShowCustomerModal(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								<X size={24} />
							</button>
						</div>

						<div className="p-4 sm:p-6">
							<div className="space-y-6">
								<div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 sm:p-6 rounded-lg">
									<h3 className="text-xl sm:text-2xl font-bold mb-2">
										{selectedCustomer.name}
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
										<p>📧 {selectedCustomer.email || "N/A"}</p>
										<p>📱 {selectedCustomer.phone}</p>
									</div>
								</div>

								<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Total Purchases</p>
										<p className="text-2xl font-bold text-blue-600">
											{selectedCustomer.analytics?.totalPurchases || 0}
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Total Spent</p>
										<p className="text-2xl font-bold text-green-600">
											₦
											{(
												selectedCustomer.analytics?.totalSpent || 0
											).toLocaleString()}
										</p>
									</div>
									<div className="bg-purple-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Total Items</p>
										<p className="text-2xl font-bold text-purple-600">
											{selectedCustomer.analytics?.totalItems || 0}
										</p>
									</div>
									<div className="bg-orange-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Last Purchase</p>
										<p className="text-sm font-bold text-orange-600">
											{selectedCustomer.analytics?.lastPurchase
												? new Date(
														selectedCustomer.analytics.lastPurchase
												  ).toLocaleDateString()
												: "N/A"}
										</p>
									</div>
								</div>

								{selectedCustomer.analytics?.productsPurchased &&
									selectedCustomer.analytics.productsPurchased.length > 0 && (
										<div>
											<h4 className="text-lg font-semibold text-black mb-3">
												Products Purchased
											</h4>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												{selectedCustomer.analytics.productsPurchased.map(
													(item) => (
														<div
															key={item.product?.id}
															className="border rounded-lg p-4 bg-gray-50"
														>
															<div className="flex justify-between items-start mb-2">
																<h5 className="font-semibold text-black">
																	{item.product?.name}
																</h5>
																<span className="text-sm font-bold text-green-600">
																	₦{item.total.toLocaleString()}
																</span>
															</div>
															<p className="text-sm text-gray-600">
																Quantity: {item.quantity} units
															</p>
															<p className="text-xs text-gray-500">
																Unit Price: ₦
																{item.product?.price.toLocaleString()}
															</p>
														</div>
													)
												)}
											</div>
										</div>
									)}

								{selectedCustomer.analytics?.salesHistory &&
									selectedCustomer.analytics.salesHistory.length > 0 && (
										<div>
											<h4 className="text-lg font-semibold text-black mb-3">
												Purchase History
											</h4>
											<div className="overflow-x-auto">
												<table className="w-full border-collapse text-sm">
													<thead>
														<tr className="bg-gray-100">
															<th className="border p-2 text-left text-black">
																Date
															</th>
															<th className="border p-2 text-left text-black">
																Product
															</th>
															<th className="border p-2 text-left text-black">
																Month
															</th>
															<th className="border p-2 text-right text-black">
																Qty
															</th>
															<th className="border p-2 text-right text-black">
																Total
															</th>
														</tr>
													</thead>
													<tbody>
														{selectedCustomer.analytics.salesHistory.map(
															(sale, index) => (
																<tr key={index} className="hover:bg-gray-50">
																	<td className="border text-black p-2 text-xs">
																		{new Date(sale.date).toLocaleDateString()}
																	</td>
																	<td className="border text-black p-2 text-xs">
																		{sale.product?.name}
																	</td>
																	<td className="border text-black p-2 text-xs">
																		{sale.month}
																	</td>
																	<td className="border text-black p-2 text-right text-xs">
																		{sale.quantity}
																	</td>
																	<td className="border text-black p-2 text-right text-xs">
																		₦
																		{(
																			sale.product?.price * sale.quantity
																		).toLocaleString()}
																	</td>
																</tr>
															)
														)}
													</tbody>
												</table>
											</div>
										</div>
									)}
							</div>
						</div>
					</div>
				</div>
			)} */}
			// Replace the Customer Details Modal section (around line 900-1050) with
			this fixed version:
			{/* Customer Details Modal */}
			{showCustomerModal && selectedCustomer && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
							<h2 className="text-xl font-bold text-black">Customer Details</h2>
							<button
								onClick={() => setShowCustomerModal(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								<X size={24} />
							</button>
						</div>

						<div className="p-4 sm:p-6">
							<div className="space-y-6">
								<div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 sm:p-6 rounded-lg">
									<h3 className="text-xl sm:text-2xl font-bold mb-2">
										{selectedCustomer.name}
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
										<p>📧 {selectedCustomer.email || "N/A"}</p>
										<p>📱 {selectedCustomer.phone}</p>
									</div>
								</div>

								<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Total Purchases</p>
										<p className="text-2xl font-bold text-blue-600">
											{selectedCustomer.analytics?.totalPurchases || 0}
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Total Spent</p>
										<p className="text-2xl font-bold text-green-600">
											₦
											{(
												selectedCustomer.analytics?.totalSpent || 0
											).toLocaleString()}
										</p>
									</div>
									<div className="bg-purple-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Total Items</p>
										<p className="text-2xl font-bold text-purple-600">
											{selectedCustomer.analytics?.totalItems || 0}
										</p>
									</div>
									<div className="bg-orange-50 p-4 rounded-lg">
										<p className="text-xs text-gray-600">Last Purchase</p>
										<p className="text-sm font-bold text-orange-600">
											{selectedCustomer.analytics?.lastPurchase
												? new Date(
														selectedCustomer.analytics.lastPurchase
												  ).toLocaleDateString()
												: "N/A"}
										</p>
									</div>
								</div>

								{selectedCustomer.analytics?.productsPurchased &&
									selectedCustomer.analytics.productsPurchased.length > 0 && (
										<div>
											<h4 className="text-lg font-semibold text-black mb-3">
												Products Purchased
											</h4>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												{selectedCustomer.analytics.productsPurchased.map(
													(item) => (
														<div
															key={item.product?.id}
															className="border rounded-lg p-4 bg-gray-50"
														>
															<div className="flex justify-between items-start mb-2">
																<h5 className="font-semibold text-black">
																	{item.product?.name}
																</h5>
																<span className="text-sm font-bold text-green-600">
																	₦{item.total.toLocaleString()}
																</span>
															</div>
															<p className="text-sm text-gray-600">
																Quantity: {item.quantity} units
															</p>
															<p className="text-xs text-gray-500">
																Unit Price: ₦
																{item.product?.price.toLocaleString()}
															</p>
														</div>
													)
												)}
											</div>
										</div>
									)}

								{selectedCustomer.analytics?.salesHistory &&
									selectedCustomer.analytics.salesHistory.length > 0 && (
										<div>
											<h4 className="text-lg font-semibold text-black mb-3">
												Purchase History
											</h4>
											<div className="overflow-x-auto">
												<table className="w-full border-collapse text-sm">
													<thead>
														<tr className="bg-gray-100">
															<th className="border p-2 text-left text-black">
																Date
															</th>
															<th className="border p-2 text-left text-black">
																Product
															</th>
															<th className="border p-2 text-left text-black">
																Month
															</th>
															<th className="border p-2 text-right text-black">
																Qty
															</th>
															<th className="border p-2 text-right text-black">
																Total
															</th>
														</tr>
													</thead>
													<tbody>
														{selectedCustomer.analytics.salesHistory.map(
															(sale, index) => {
																// FIX: Handle date parsing properly
																const formatDate = (dateString: string) => {
																	try {
																		const date = new Date(dateString);
																		// Check if date is valid
																		if (isNaN(date.getTime())) {
																			return "N/A";
																		}
																		return date.toLocaleDateString();
																	} catch (error) {
																		return "N/A";
																	}
																};

																return (
																	<tr key={index} className="hover:bg-gray-50">
																		<td className="border text-black p-2 text-xs">
																			{formatDate(sale.date)}
																		</td>
																		<td className="border text-black p-2 text-xs">
																			{sale.product?.name}
																		</td>
																		<td className="border text-black p-2 text-xs">
																			{sale.month}
																		</td>
																		<td className="border text-black p-2 text-right text-xs">
																			{sale.quantity}
																		</td>
																		<td className="border text-black p-2 text-right text-xs">
																			₦
																			{(
																				sale.product?.price * sale.quantity
																			).toLocaleString()}
																		</td>
																	</tr>
																);
															}
														)}
													</tbody>
												</table>
											</div>
										</div>
									)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ExcelSalesReport;
