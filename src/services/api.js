const API_BASE_URL = "http://localhost:5000/api";

import axios from "axios";
import config from "../config";

const api = axios.create({
	baseURL: config.API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// API helper function
const apiCall = async (endpoint, options = {}) => {
	const token = getToken();

	const headers = {
		"Content-Type": "application/json",
		...(token && { Authorization: `Bearer ${token}` }),
		...options.headers,
	};

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Request failed");
	}

	return response.json();
};

// Auth APIs
export const authAPI = {
	login: (credentials) =>
		apiCall("/auth/login", {
			method: "POST",
			body: JSON.stringify(credentials),
		}),

	register: (userData) =>
		apiCall("/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
		}),

	getMe: () => apiCall("/auth/me"),
};

// Product APIs
export const productAPI = {
	getAll: (params) => {
		const query = new URLSearchParams(params).toString();
		return apiCall(`/products?${query}`);
	},

	getOne: (id) => apiCall(`/products/${id}`),

	create: (data) =>
		apiCall("/products", {
			method: "POST",
			body: JSON.stringify(data),
		}),

	update: (id, data) =>
		apiCall(`/products/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),

	delete: (id) =>
		apiCall(`/products/${id}`, {
			method: "DELETE",
		}),

	adjustStock: (id, data) =>
		apiCall(`/products/${id}/adjust-stock`, {
			method: "POST",
			body: JSON.stringify(data),
		}),
};

// Customer APIs
export const customerAPI = {
	getAll: (params) => {
		const query = new URLSearchParams(params).toString();
		return apiCall(`/customers?${query}`);
	},

	getOne: (id) => apiCall(`/customers/${id}`),

	create: (data) =>
		apiCall("/customers", {
			method: "POST",
			body: JSON.stringify(data),
		}),

	update: (id, data) =>
		apiCall(`/customers/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),

	delete: (id) =>
		apiCall(`/customers/${id}`, {
			method: "DELETE",
		}),
};

// Sales APIs
export const salesAPI = {
	getAll: (params) => {
		const query = new URLSearchParams(params).toString();
		return apiCall(`/sales?${query}`);
	},

	getOne: (id) => apiCall(`/sales/${id}`),

	create: (data) =>
		apiCall("/sales", {
			method: "POST",
			body: JSON.stringify(data),
		}),

	update: (id, data) =>
		apiCall(`/sales/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),

	delete: (id) =>
		apiCall(`/sales/${id}`, {
			method: "DELETE",
		}),

	getMonthlySummary: () => apiCall("/sales/monthly-summary"),
};

// Analytics APIs
export const analyticsAPI = {
	getDashboard: () => apiCall("/analytics/dashboard"),
	getTopProducts: (limit) => apiCall(`/analytics/top-products?limit=${limit}`),
	getTopCustomers: (limit) =>
		apiCall(`/analytics/top-customers?limit=${limit}`),
	getRevenueTrends: (period) =>
		apiCall(`/analytics/revenue-trends?period=${period}`),
};
