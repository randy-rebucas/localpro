"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
	label?: string;
	className?: string;
}

export function LoadingSpinner({ label = "Loading", className }: LoadingProps) {
	return (
		<div className={cn("flex flex-col items-center justify-center", className)}>
			<div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-green-600"></div>
			{label && (
				<p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
					{label}...
				</p>
			)}
		</div>
	);
}

export function LoadingSection({ label = "Loading section" }: LoadingProps) {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
			<LoadingSpinner label={label} />
		</div>
	);
}

export function LoadingPage({ label = "Loading page" }: LoadingProps) {
	return (
		<div className="min-h-[60vh] flex items-center justify-center">
			<LoadingSpinner label={label} />
		</div>
	);
}


