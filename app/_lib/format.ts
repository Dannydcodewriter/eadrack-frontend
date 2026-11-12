import type { Product } from "./types";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
	maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en", {
	notation: "compact",
	maximumFractionDigits: 1,
});

export const formatNaira = (value: number | null | undefined) =>
	`₦${nairaFormatter.format(value || 0)}`;

/** ₦12.9K / ₦4.2M — for axes and tight spaces. */
export const formatNairaCompact = (value: number | null | undefined) =>
	`₦${compactFormatter.format(value || 0)}`;

export const formatNumber = (value: number | null | undefined) =>
	nairaFormatter.format(value || 0);

export const formatDate = (value?: string | null) => {
	if (!value) return "—";
	const date = new Date(value);
	if (isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
};

export const initials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "?";

export type StockStatus = "out" | "low" | "ok";

export const stockStatus = (product: Product): StockStatus => {
	if (product.currentStock <= 0) return "out";
	if (product.currentStock <= product.reorderLevel) return "low";
	return "ok";
};

export const percentSold = (product: Product) => {
	if (!product.initialStock) return 0;
	const sold = product.initialStock - product.currentStock;
	return Math.max(0, Math.min(100, (sold / product.initialStock) * 100));
};

// Real phone/email only — many records store placeholders like "N/A".
export const realPhone = (c: { phone?: string | null }) =>
	/\d/.test(c.phone ?? "") ? c.phone! : null;
export const realEmail = (c: { email?: string | null }) =>
	c.email && c.email.includes("@") ? c.email : null;

export const currentMonthName = () =>
	new Date().toLocaleString("en-US", { month: "long" });

export const cn = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(" ");
