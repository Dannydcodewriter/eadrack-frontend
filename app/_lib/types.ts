export interface User {
	id: number | string;
	fullName: string;
	email: string;
	role: "ADMIN" | "STAFF" | "USER";
}

export interface Product {
	id: string;
	name: string;
	category: string;
	initialStock: number;
	currentStock: number;
	price: number;
	reorderLevel: number;
	supplier?: string | null;
}

export interface StockAdjustment {
	id: string;
	productId: string;
	adjustmentType: "ADDITION" | "SALE" | "CORRECTION";
	quantityChange: number;
	previousStock: number;
	newStock: number;
	reason?: string | null;
	createdAt: string;
	adjustedBy?: { fullName: string } | null;
}

export interface RestockInput {
	quantity: number;
	price?: number;
	supplier?: string;
	reference?: string;
	note?: string;
}

export interface ShipmentInput {
	items: Array<{ productId: string; quantity: number; price?: number }>;
	supplier?: string;
	reference?: string;
	note?: string;
}

export interface CustomerSaleRecord {
	// Backend returns `saleDate`; older shape used `date`.
	saleDate?: string;
	date?: string;
	product: Product;
	month: string;
	quantity: number;
	totalPrice?: number;
}

export interface Customer {
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
		salesHistory: CustomerSaleRecord[];
	};
}

export interface Sale {
	id: string;
	saleDate: string;
	product: Product;
	customer: Customer;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	month: string;
}

export interface DashboardStats {
	totalRevenue: number;
	totalUnitsSold: number;
	totalCustomers: number;
	totalProducts?: number;
	lowStockCount?: number;
	todayRevenue?: number;
	todayUnits?: number;
	monthRevenue?: number;
	monthUnits?: number;
}

export interface TopProduct {
	product: Product;
	totalSold: number;
	totalRevenue: number;
}

export interface TopCustomer {
	customer: Customer;
	totalSpent: number;
	totalPurchases?: number;
	totalItems?: number;
}

export interface RevenueTrend {
	month: string;
	revenue: number;
	quantity?: number;
	salesCount?: number;
}

export const MONTHS = [
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

export type TabId = "dashboard" | "sales" | "products" | "customers";
