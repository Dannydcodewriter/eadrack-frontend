"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "../_lib/format";

type Theme = "light" | "dark";

// The <html class="dark"> flag is the source of truth (set before paint by
// the inline script in layout.tsx). We subscribe to it so every toggle on
// the page stays in sync.
const subscribe = (callback: () => void) => {
	const observer = new MutationObserver(callback);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
	return () => observer.disconnect();
};

const getSnapshot = (): Theme =>
	document.documentElement.classList.contains("dark") ? "dark" : "light";

const getServerSnapshot = (): Theme => "light";

export function useTheme() {
	const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const setTheme = (next: Theme) => {
		const root = document.documentElement;
		// Switch every color in the same frame (no per-element fades).
		root.classList.add("theme-switching");
		root.classList.toggle("dark", next === "dark");
		requestAnimationFrame(() =>
			requestAnimationFrame(() => root.classList.remove("theme-switching"))
		);
		try {
			localStorage.setItem("theme", next);
		} catch {
			/* storage unavailable — theme still applies for this session */
		}
	};

	return {
		theme,
		setTheme,
		toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
	};
}

/** Compact segmented switch: sun | moon. */
export function ThemeToggle({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();

	const option = (value: Theme, label: string, icon: React.ReactNode) => {
		const active = theme === value;
		return (
			<button
				type="button"
				role="radio"
				aria-checked={active}
				aria-label={label}
				title={label}
				onClick={() => setTheme(value)}
				className={cn(
					"flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 cursor-pointer",
					active
						? "bg-surface text-ink shadow-card"
						: "text-ink-3 hover:text-ink"
				)}
			>
				{icon}
			</button>
		);
	};

	return (
		<div
			role="radiogroup"
			aria-label="Color theme"
			className={cn(
				"inline-flex items-center gap-0.5 rounded-lg border border-line bg-subtle p-0.5",
				className
			)}
		>
			{option("light", "Light mode", <Sun size={15} />)}
			{option("dark", "Dark mode", <Moon size={15} />)}
		</div>
	);
}
