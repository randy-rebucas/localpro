"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: React.ReactNode;
	primaryAction?: React.ReactNode; // e.g. a Link or Button
	secondaryAction?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	title,
	description,
	icon,
	primaryAction,
	secondaryAction,
	className,
}: EmptyStateProps) {
	return (
		<div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center", className)}>
			<div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm">
				{icon}
			</div>
			<h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
			{description && (
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
			)}
			{(primaryAction || secondaryAction) && (
				<div className="mt-6 flex items-center justify-center gap-3">
					{primaryAction}
					{secondaryAction}
				</div>
			)}
		</div>
	);
}


