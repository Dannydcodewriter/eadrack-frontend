import type {
	Customer,
	DashboardStats,
	Product,
	RestockInput,
	RevenueTrend,
	Sale,
	ShipmentInput,
	StockAdjustment,
	TopCustomer,
	TopProduct,
	User,
} from "./types";

// The backend mounts every route under /api (see backend src/server.js).
// Accept NEXT_PUBLIC_API_URL with or without the /api suffix.
const API_BASE_URL = (() => {
	const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
	return base.endsWith("/api") ? base : `${base}/api`;
})();

/** Fired on window when the server rejects the saved login. */
export const SESSION_EXPIRED_EVENT = "eadrack:session-expired";

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

	let response: Response;
	try {
		response = await fetch(`${API_BASE_URL}${endpoint}`, {
			...options,
			headers,
		});
	} catch {
		throw new Error(
			"Can’t reach the server. Check that the backend is running and try again."
		);
	}

	// Non-JSON replies (e.g. an HTML 404 page) shouldn't surface as a parse error.
	const data = await response.json().catch(() => ({}));

	// A saved login the server no longer accepts (expired / deactivated).
	const reason = String(data.error || data.message || "");
	if (
		token &&
		endpoint !== "/auth/login" &&
		(response.status === 401 ||
			(response.status === 403 && /token|inactive/i.test(reason)))
	) {
		window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
	}

	if (!response.ok) {
		throw new Error(
			data.error ||
				data.message ||
				(response.status === 404
					? "Server endpoint not found — check NEXT_PUBLIC_API_URL."
					: `Request failed (${response.status})`)
		);
	}

	return data;
};

const toQuery = (params: Record<string, string | number>) => {
	const query = new URLSearchParams(params as Record<string, string>).toString();
	return query ? "?" + query : "";
};

export const authAPI = {
	login: (credentials: { email: string; password: string }) =>
		apiCall<{ token: string; user: User }>("/auth/login", {
			method: "POST",
			body: JSON.stringify(credentials),
		}),
	getMe: () => apiCall<User>("/auth/me"),
};

export const productAPI = {
	getAll: (params: Record<string, string | number> = {}) =>
		apiCall<{ products: Product[] }>(`/products${toQuery(params)}`),
	create: (data: Omit<Product, "id" | "currentStock">) =>
		apiCall<{ product: Product }>("/products", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	delete: (id: string) => apiCall(`/products/${id}`, { method: "DELETE" }),
	restock: (id: string, data: RestockInput) =>
		apiCall<{ message: string; product: Product }>(`/products/${id}/restock`, {
			method: "POST",
			body: JSON.stringify(data),
		}),
	receiveShipment: (data: ShipmentInput) =>
		apiCall<{ message: string; products: Product[] }>("/products/restock", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	getStockHistory: (id: string, params: { type?: StockAdjustment["adjustmentType"]; limit?: number } = {}) =>
		apiCall<{ history: StockAdjustment[] }>(
			`/products/${id}/stock-history${toQuery(params as Record<string, string | number>)}`
		),
};

export const customerAPI = {
	getAll: (params: Record<string, string | number> = {}) =>
		apiCall<{ customers: Customer[] }>(`/customers${toQuery(params)}`),
	getOne: (id: string) => apiCall<{ customer: Customer }>(`/customers/${id}`),
	create: (data: Pick<Customer, "name" | "email" | "phone">) =>
		apiCall<{ customer: Customer }>("/customers", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	delete: (id: string) => apiCall(`/customers/${id}`, { method: "DELETE" }),
};

export const salesAPI = {
	getAll: (params: Record<string, string | number> = {}) =>
		apiCall<{ sales: Sale[] }>(`/sales${toQuery(params)}`),
	create: (data: {
		productId: string;
		customerId: string;
		quantity: number;
		month: string;
	}) =>
		apiCall<{ sale: Sale }>("/sales", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	delete: (id: string) => apiCall(`/sales/${id}`, { method: "DELETE" }),
};

export const analyticsAPI = {
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
