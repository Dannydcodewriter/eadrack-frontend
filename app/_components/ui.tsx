"use client";

import React, { useEffect, useId } from "react";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	Info,
	Loader2,
	Search,
	X,
	XCircle,
} from "lucide-react";
import { cn, initials } from "../_lib/format";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "ghost-danger" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const buttonVariants: Record<ButtonVariant, string> = {
	primary:
		"bg-accent text-on-accent hover:bg-accent-hover shadow-sm shadow-accent/20",
	secondary:
		"bg-surface text-ink border border-line hover:bg-subtle hover:border-line-strong shadow-card",
	ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
	"ghost-danger": "text-ink-3 hover:bg-danger-soft hover:text-danger",
	danger: "bg-danger text-white hover:bg-danger-hover dark:text-[#1a0a0b]",
};

const buttonSizes: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
	md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
	lg: "h-11 px-5 text-sm gap-2 rounded-xl",
	icon: "h-9 w-9 rounded-lg",
	"icon-sm": "h-8 w-8 rounded-lg",
};

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
}

export function Button({
	variant = "primary",
	size = "md",
	loading = false,
	className,
	children,
	disabled,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={cn(
				"inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
				buttonVariants[variant],
				buttonSizes[size],
				className
			)}
			{...props}
		>
			{loading && <Loader2 size={16} className="animate-spin" />}
			{children}
		</button>
	);
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const controlBase =
	"w-full h-10 rounded-lg border border-line bg-surface text-sm text-ink px-3 transition-colors duration-150 hover:border-line-strong focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60";

export const Input = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(function Input({ className, icon, ...props }, ref) {
	if (icon) {
		return (
			<div className="relative">
				<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
					{icon}
				</span>
				<input
					ref={ref}
					className={cn(controlBase, "pl-9", className)}
					{...props}
				/>
			</div>
		);
	}
	return <input ref={ref} className={cn(controlBase, className)} {...props} />;
});

export function Select({
	className,
	children,
	...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<div className="relative">
			<select
				className={cn(
					controlBase,
					"appearance-none pr-9 cursor-pointer",
					className
				)}
				{...props}
			>
				{children}
			</select>
			<ChevronDown
				size={16}
				className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
			/>
		</div>
	);
}

export function SearchInput({
	value,
	onChange,
	placeholder = "Search…",
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}) {
	return (
		<div className={cn("relative", className)}>
			<Search
				size={16}
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
			/>
			<input
				type="search"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className={cn(controlBase, "h-9! pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden")}
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label="Clear search"
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 hover:bg-subtle hover:text-ink cursor-pointer"
				>
					<X size={14} />
				</button>
			)}
		</div>
	);
}

/** Label + control + optional hint, with the label wired to the control. */
export function Field({
	label,
	hint,
	required,
	children,
	className,
}: {
	label: string;
	hint?: React.ReactNode;
	required?: boolean;
	children: (id: string) => React.ReactNode;
	className?: string;
}) {
	const id = useId();
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<label htmlFor={id} className="text-[13px] font-medium text-ink-2">
				{label}
				{required && <span className="text-danger ml-0.5">*</span>}
			</label>
			{children(id)}
			{hint && <p className="text-xs text-ink-3">{hint}</p>}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"rounded-2xl border border-line bg-surface shadow-card",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function CardHeader({
	title,
	description,
	icon,
	action,
	className,
}: {
	title: React.ReactNode;
	description?: React.ReactNode;
	icon?: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-start justify-between gap-3 px-4 pt-5 sm:px-5",
				className
			)}
		>
			<div className="flex min-w-0 flex-1 items-start gap-3">
				{icon && (
					<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-2">
						{icon}
					</span>
				)}
				<div className="min-w-0">
					<h3 className="text-[15px] font-semibold text-ink tracking-tight">
						{title}
					</h3>
					{description && (
						<p className="mt-0.5 text-[13px] text-ink-3">{description}</p>
					)}
				</div>
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Badge, Avatar, Meter                                                */
/* ------------------------------------------------------------------ */

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const badgeTones: Record<Tone, string> = {
	neutral: "bg-subtle text-ink-2 border-line",
	accent: "bg-accent-soft text-accent-ink border-transparent",
	success: "bg-success-soft text-success border-transparent",
	warning: "bg-warning-soft text-warning border-transparent",
	danger: "bg-danger-soft text-danger border-transparent",
};

export function Badge({
	tone = "neutral",
	icon,
	children,
	className,
}: {
	tone?: Tone;
	icon?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
				badgeTones[tone],
				className
			)}
		>
			{icon}
			{children}
		</span>
	);
}

const avatarTints = [
	"bg-[#eeedfd] text-[#3b32b8] dark:bg-[#24214a] dark:text-[#c3beff]",
	"bg-[#e6f4f1] text-[#0f6b5c] dark:bg-[#12302b] dark:text-[#8ee0cf]",
	"bg-[#fdf0e6] text-[#9a4a0b] dark:bg-[#33220f] dark:text-[#f8c48e]",
	"bg-[#fbe9f1] text-[#a01d5b] dark:bg-[#361528] dark:text-[#f5a8cb]",
	"bg-[#e8f0fb] text-[#1d4f91] dark:bg-[#142640] dark:text-[#a3c6f5]",
	"bg-[#f1eefa] text-[#5b3aa6] dark:bg-[#271d40] dark:text-[#cdb8f7]",
];

const hashString = (value: string) => {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
};

export function Avatar({
	name,
	size = "md",
	className,
}: {
	name: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}) {
	const sizes = {
		sm: "h-7 w-7 text-[11px]",
		md: "h-8 w-8 text-xs",
		lg: "h-12 w-12 text-base",
	};
	return (
		<span
			aria-hidden
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
				avatarTints[hashString(name) % avatarTints.length],
				sizes[size],
				className
			)}
		>
			{initials(name)}
		</span>
	);
}

/** A thin horizontal meter. The track is a lighter step of the fill. */
export function Meter({
	value,
	tone = "accent",
	className,
	label,
}: {
	value: number;
	tone?: "accent" | "success" | "warning" | "danger";
	className?: string;
	label?: string;
}) {
	const fills = {
		accent: "bg-accent",
		success: "bg-success",
		warning: "bg-warning",
		danger: "bg-danger",
	};
	const tracks = {
		accent: "bg-accent-soft",
		success: "bg-success-soft",
		warning: "bg-warning-soft",
		danger: "bg-danger-soft",
	};
	const pct = Math.max(0, Math.min(100, value));
	return (
		<div
			role="meter"
			aria-valuenow={Math.round(pct)}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={label}
			className={cn("h-1.5 w-full overflow-hidden rounded-full", tracks[tone], className)}
		>
			<div
				className={cn("h-full rounded-full transition-[width] duration-500", fills[tone])}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export function StatCard({
	label,
	value,
	hint,
	icon,
}: {
	label: string;
	value: React.ReactNode;
	hint?: React.ReactNode;
	icon?: React.ReactNode;
}) {
	return (
		<Card className="p-5">
			<div className="flex items-center justify-between gap-2">
				<p className="text-[13px] font-medium text-ink-3">{label}</p>
				{icon && (
					<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
						{icon}
					</span>
				)}
			</div>
			<p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-ink tabular-nums leading-none">
				{value}
			</p>
			{hint && <p className="mt-2 text-xs text-ink-3">{hint}</p>}
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
	icon,
	title,
	description,
	action,
}: {
	icon: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center px-6 py-14 text-center">
			<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-ink-3">
				{icon}
			</span>
			<p className="mt-4 text-sm font-semibold text-ink">{title}</p>
			{description && (
				<p className="mt-1 max-w-xs text-[13px] text-ink-3">{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Paging ("Show more") for long lists                                 */
/* ------------------------------------------------------------------ */

export const PAGE_SIZE = 25;

export function ShowMore({
	shown,
	total,
	noun,
	onMore,
	onAll,
}: {
	shown: number;
	total: number;
	noun: string;
	onMore: () => void;
	onAll: () => void;
}) {
	if (shown >= total) return null;
	const next = Math.min(PAGE_SIZE, total - shown);
	return (
		<div className="flex flex-col items-center gap-2 border-t border-line px-4 py-4 sm:flex-row sm:justify-between">
			<p className="text-xs text-ink-3 tabular-nums">
				Showing {shown.toLocaleString()} of {total.toLocaleString()} {noun}
			</p>
			<div className="flex gap-2">
				<Button variant="secondary" size="sm" onClick={onMore}>
					Show {next} more
				</Button>
				<Button variant="ghost" size="sm" onClick={onAll}>
					Show all
				</Button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Table helpers                                                       */
/* ------------------------------------------------------------------ */

export const tableClasses = {
	wrap: "overflow-x-auto",
	table: "w-full min-w-[640px] border-separate border-spacing-0 text-sm",
	th: "sticky top-0 z-[1] bg-subtle/80 backdrop-blur px-4 py-2.5 text-left text-xs font-medium text-ink-3 border-y border-line first:pl-5 last:pr-5 whitespace-nowrap",
	td: "px-4 py-3 border-b border-line text-ink-2 first:pl-5 last:pr-5 align-middle",
	tr: "transition-colors hover:bg-subtle/60",
	tfoot: "px-4 py-3 bg-subtle/60 font-semibold text-ink first:pl-5 last:pr-5",
};

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
	open,
	onClose,
	title,
	description,
	children,
	footer,
	size = "md",
}: {
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	description?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
}) {
	const titleId = useId();

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKey);
		};
	}, [open, onClose]);

	if (!open) return null;

	const widths = {
		sm: "max-w-md",
		md: "max-w-lg",
		lg: "max-w-2xl",
		xl: "max-w-4xl",
	};

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
			<div
				className="absolute inset-0 bg-overlay backdrop-blur-[2px] animate-fade-in"
				onClick={onClose}
				aria-hidden
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? titleId : undefined}
				className={cn(
					"relative flex w-full flex-col max-h-[92vh] rounded-t-2xl sm:rounded-2xl border border-line bg-surface shadow-pop animate-pop-in",
					widths[size]
				)}
			>
				{title && (
					<div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
						<div className="min-w-0">
							<h2 id={titleId} className="text-base font-semibold text-ink">
								{title}
							</h2>
							{description && (
								<p className="mt-0.5 text-[13px] text-ink-3">{description}</p>
							)}
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={onClose}
							aria-label="Close"
							className="-mr-1.5 -mt-1"
						>
							<X size={18} />
						</Button>
					</div>
				)}
				<div className="overflow-y-auto">{children}</div>
				{footer && (
					<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-line px-5 py-4">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}

export interface ConfirmOptions {
	title: string;
	message: string;
	confirmLabel?: string;
	onConfirm: () => Promise<void> | void;
}

export function ConfirmDialog({
	options,
	busy,
	onCancel,
	onConfirm,
}: {
	options: ConfirmOptions | null;
	busy: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	return (
		<Modal
			open={!!options}
			onClose={busy ? () => {} : onCancel}
			size="sm"
		>
			<div className="p-5 sm:p-6">
				<div className="flex gap-4">
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
						<AlertTriangle size={20} />
					</span>
					<div>
						<h2 className="text-base font-semibold text-ink">
							{options?.title}
						</h2>
						<p className="mt-1 text-sm text-ink-2">{options?.message}</p>
					</div>
				</div>
				<div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
					<Button variant="secondary" onClick={onCancel} disabled={busy}>
						Cancel
					</Button>
					<Button variant="danger" onClick={onConfirm} loading={busy}>
						{options?.confirmLabel ?? "Delete"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
	id: number;
	tone: ToastTone;
	message: string;
}

export function Toaster({
	toasts,
	onDismiss,
}: {
	toasts: ToastItem[];
	onDismiss: (id: number) => void;
}) {
	const icons = {
		success: <CheckCircle2 size={18} className="text-success" />,
		error: <XCircle size={18} className="text-danger" />,
		info: <Info size={18} className="text-accent" />,
	};
	return (
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
		>
			{toasts.map((toast) => (
				<div
					key={toast.id}
					role={toast.tone === "error" ? "alert" : "status"}
					className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop animate-toast-in"
				>
					<span className="mt-px">{icons[toast.tone]}</span>
					<p className="flex-1 text-sm text-ink">{toast.message}</p>
					<button
						type="button"
						onClick={() => onDismiss(toast.id)}
						aria-label="Dismiss notification"
						className="-mr-1 rounded-md p-0.5 text-ink-3 hover:bg-subtle hover:text-ink cursor-pointer"
					>
						<X size={16} />
					</button>
				</div>
			))}
		</div>
	);
}
