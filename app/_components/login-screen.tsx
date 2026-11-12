"use client";

import React, { useState } from "react";
import {
	AlertCircle,
	BarChart3,
	Eye,
	EyeOff,
	Lock,
	Mail,
	Package,
	Users,
} from "lucide-react";
import { Button, Field, Input } from "./ui";
import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./brand";

export function LoginScreen({
	form,
	onChange,
	onSubmit,
	error,
	loading,
}: {
	form: { email: string; password: string };
	onChange: (form: { email: string; password: string }) => void;
	onSubmit: (e: React.FormEvent) => void;
	error: string;
	loading: boolean;
}) {
	const [showPassword, setShowPassword] = useState(false);

	const features = [
		{
			icon: <BarChart3 size={18} />,
			title: "Live revenue insight",
			text: "Monthly trends, top products and best customers at a glance.",
		},
		{
			icon: <Package size={18} />,
			title: "Inventory that warns you",
			text: "Stock levels update with every sale, with low-stock alerts.",
		},
		{
			icon: <Users size={18} />,
			title: "Every customer, remembered",
			text: "Purchase history and lifetime spend in one place.",
		},
	];

	return (
		<div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-canvas">
			{/* Brand panel */}
			<aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#17153a] p-12 text-white">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-90"
					style={{
						background:
							"radial-gradient(60% 50% at 15% 10%, rgba(123,115,245,0.55) 0%, transparent 70%), radial-gradient(50% 45% at 90% 85%, rgba(81,70,229,0.5) 0%, transparent 70%)",
					}}
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-[0.07]"
					style={{
						backgroundImage:
							"linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
						backgroundSize: "44px 44px",
					}}
				/>

				<div className="relative flex items-center gap-3">
					<BrandMark className="h-10 w-10" inverted />
					<div>
						<p className="font-semibold tracking-tight">Eadrack Trading</p>
						<p className="text-xs text-white/60">Sales & Inventory</p>
					</div>
				</div>

				<div className="relative max-w-md">
					<h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">
						Run your sales and stock from one calm place.
					</h2>
					<ul className="mt-10 space-y-6">
						{features.map((f) => (
							<li key={f.title} className="flex gap-4">
								<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
									{f.icon}
								</span>
								<div>
									<p className="text-sm font-medium">{f.title}</p>
									<p className="mt-0.5 text-sm text-white/65">{f.text}</p>
								</div>
							</li>
						))}
					</ul>
				</div>

				<p className="relative text-xs text-white/50">
					© {new Date().getFullYear()} Eadrack Trading
				</p>
			</aside>

			{/* Form */}
			<main className="relative flex flex-col items-center justify-center px-4 py-12 sm:px-8">
				<ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />

				<div className="w-full max-w-[380px]">
					<div className="mb-8 flex flex-col items-start gap-5">
						<BrandMark className="h-11 w-11 lg:hidden" />
						<div>
							<h1 className="text-2xl font-semibold tracking-tight text-ink">
								Welcome back
							</h1>
							<p className="mt-1.5 text-sm text-ink-3">
								Sign in to your Eadrack workspace to continue.
							</p>
						</div>
					</div>

					<form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
						<Field label="Email address">
							{(id) => (
								<Input
									id={id}
									type="email"
									autoComplete="email"
									icon={<Mail size={16} />}
									value={form.email}
									onChange={(e) => onChange({ ...form, email: e.target.value })}
									placeholder="you@eadrack.com"
									className="h-11!"
									required
									autoFocus
								/>
							)}
						</Field>

						<Field label="Password">
							{(id) => (
								<div className="relative">
									<Input
										id={id}
										type={showPassword ? "text" : "password"}
										autoComplete="current-password"
										icon={<Lock size={16} />}
										value={form.password}
										onChange={(e) =>
											onChange({ ...form, password: e.target.value })
										}
										placeholder="Enter your password"
										className="h-11! pr-11"
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword((v) => !v)}
										aria-label={showPassword ? "Hide password" : "Show password"}
										className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink-3 hover:bg-subtle hover:text-ink cursor-pointer"
									>
										{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
							)}
						</Field>

						{error && (
							<div
								role="alert"
								className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm text-danger"
							>
								<AlertCircle size={16} className="mt-0.5 shrink-0" />
								<span>{error}</span>
							</div>
						)}

						<Button
							type="submit"
							size="lg"
							loading={loading}
							className="w-full mt-2"
						>
							{loading ? "Signing in…" : "Sign in"}
						</Button>
					</form>

					<p className="mt-8 text-center text-xs text-ink-3">
						Need access? Ask an administrator to create your account.
					</p>
				</div>
			</main>
		</div>
	);
}
