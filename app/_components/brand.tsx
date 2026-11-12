import { cn } from "../_lib/format";

/** The Eadrack mark: a stacked-crates glyph on a rounded tile. */
export function BrandMark({
	className,
	inverted = false,
}: {
	className?: string;
	inverted?: boolean;
}) {
	return (
		<span
			aria-hidden
			className={cn(
				"inline-flex items-center justify-center rounded-xl",
				inverted
					? "bg-white text-[#3b32b8]"
					: "bg-accent text-on-accent shadow-sm shadow-accent/30",
				className
			)}
		>
			<svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none">
				<path
					d="M4 9.5 12 5l8 4.5-8 4.5-8-4.5Z"
					fill="currentColor"
					opacity="0.95"
				/>
				<path
					d="m4 13.5 8 4.5 8-4.5"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity="0.7"
				/>
				<path
					d="m4 17 8 4.5 8-4.5"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity="0.45"
				/>
			</svg>
		</span>
	);
}
