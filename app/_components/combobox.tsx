"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "../_lib/format";

export interface ComboboxOption {
	value: string;
	label: string;
	/** Secondary text shown on the right (e.g. stock, phone). Also searchable. */
	hint?: string;
	disabled?: boolean;
}

/**
 * A searchable single-select. Unlike a native <select>, the list is drawn by
 * the app, so it looks the same in light/dark mode on every browser and can
 * be filtered by typing.
 */
export function Combobox({
	id,
	value,
	onChange,
	options,
	placeholder = "Select…",
	searchPlaceholder = "Search…",
	emptyText = "No matches",
	noun,
	invalid,
	footerAction,
}: {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	options: ComboboxOption[];
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: React.ReactNode;
	/** Plural noun for the count line, e.g. "customers". */
	noun?: string;
	invalid?: boolean;
	/** Optional action pinned under the list (e.g. "Add new customer"). */
	footerAction?: { label: string; icon?: React.ReactNode; onSelect: () => void };
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const listId = useId();

	const selected = options.find((o) => o.value === value);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) =>
				o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)
		);
	}, [options, query]);

	const close = (focusTrigger = true) => {
		setOpen(false);
		setQuery("");
		if (focusTrigger) triggerRef.current?.focus();
	};

	const openList = () => {
		const index = options.findIndex((o) => o.value === value);
		setActive(index >= 0 ? index : 0);
		setQuery("");
		setOpen(true);
	};

	const choose = (option: ComboboxOption | undefined) => {
		if (!option || option.disabled) return;
		onChange(option.value);
		close();
	};

	// Close when clicking outside.
	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) close(false);
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [open]);

	// Keep the highlighted option in view.
	useEffect(() => {
		if (!open) return;
		listRef.current
			?.querySelector('[data-active="true"]')
			?.scrollIntoView({ block: "nearest" });
	}, [active, open, query]);

	const move = (delta: number) => {
		if (!filtered.length) return;
		let next = active;
		for (let i = 0; i < filtered.length; i++) {
			next = (next + delta + filtered.length) % filtered.length;
			if (!filtered[next].disabled) break;
		}
		setActive(next);
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			move(1);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			move(-1);
		} else if (e.key === "Enter") {
			e.preventDefault();
			choose(filtered[active]);
		} else if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			close();
		} else if (e.key === "Tab") {
			close(false);
		}
	};

	return (
		<div ref={rootRef} className="relative">
			<button
				ref={triggerRef}
				id={id}
				type="button"
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={open ? listId : undefined}
				aria-invalid={invalid || undefined}
				onClick={() => (open ? close() : openList())}
				onKeyDown={(e) => {
					if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
						e.preventDefault();
						openList();
					}
				}}
				className={cn(
					"flex h-10 w-full items-center gap-2 rounded-lg border bg-surface px-3 text-left text-sm transition-colors duration-150 cursor-pointer hover:border-line-strong focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15",
					open ? "border-accent ring-4 ring-accent/15" : "border-line",
					invalid && "border-danger"
				)}
			>
				<span className={cn("min-w-0 flex-1 truncate", selected ? "text-ink" : "text-ink-3")}>
					{selected ? selected.label : placeholder}
				</span>
				{selected?.hint && (
					<span className="shrink-0 text-xs text-ink-3 tabular-nums max-sm:hidden">
						{selected.hint}
					</span>
				)}
				<ChevronDown
					size={16}
					className={cn("shrink-0 text-ink-3 transition-transform", open && "rotate-180")}
				/>
			</button>

			{open && (
				<div className="absolute left-0 right-0 z-30 mt-1.5 min-w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-pop-in">
					<div className="relative border-b border-line">
						<Search
							size={15}
							className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
						/>
						<input
							autoFocus
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setActive(0);
							}}
							onKeyDown={onKeyDown}
							placeholder={searchPlaceholder}
							aria-label={searchPlaceholder}
							aria-controls={listId}
							aria-activedescendant={
								filtered[active] ? `${listId}-${filtered[active].value}` : undefined
							}
							className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-ink focus:outline-none"
						/>
					</div>

					<ul
						ref={listRef}
						id={listId}
						role="listbox"
						className="max-h-64 overflow-y-auto p-1"
					>
						{filtered.length === 0 ? (
							<li className="px-3 py-6 text-center text-[13px] text-ink-3">{emptyText}</li>
						) : (
							filtered.map((option, index) => {
								const isSelected = option.value === value;
								const isActive = index === active;
								return (
									<li
										key={option.value}
										id={`${listId}-${option.value}`}
										role="option"
										aria-selected={isSelected}
										aria-disabled={option.disabled || undefined}
										data-active={isActive}
										onMouseEnter={() => !option.disabled && setActive(index)}
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => choose(option)}
										className={cn(
											"flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
											option.disabled
												? "cursor-not-allowed opacity-45"
												: "cursor-pointer",
											isActive && !option.disabled && "bg-subtle"
										)}
									>
										<Check
											size={14}
											className={cn("shrink-0 text-accent", !isSelected && "invisible")}
										/>
										<span className="min-w-0 flex-1 truncate text-ink">{option.label}</span>
										{option.hint && (
											<span className="shrink-0 text-xs text-ink-3 tabular-nums">
												{option.hint}
											</span>
										)}
									</li>
								);
							})
						)}
					</ul>

					<div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
						<span className="text-xs text-ink-3 tabular-nums">
							{query
								? `${filtered.length} of ${options.length}`
								: `${options.length}`}
							{noun ? ` ${noun}` : ""}
						</span>
						{footerAction && (
							<button
								type="button"
								onClick={() => {
									close(false);
									footerAction.onSelect();
								}}
								className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-accent-ink hover:bg-accent-soft cursor-pointer"
							>
								{footerAction.icon}
								{footerAction.label}
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
