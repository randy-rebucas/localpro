import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	padding?: "none" | "sm" | "md" | "lg";
	interactive?: boolean;
}

export function Card({ className, padding = "md", interactive = true, ...props }: CardProps) {
	const paddingMap = {
		none: "p-0",
		sm: "p-4",
		md: "p-6",
		lg: "p-8",
	};

	return (
		<div
			className={cn(
				"bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm",
				interactive && "hover:shadow-md transition-shadow",
				paddingMap[padding],
				className
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("mb-4 flex items-center justify-between", className)} {...props} />
	);
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
	return <h3 className={cn("text-lg font-semibold text-gray-900", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("space-y-3", className)} {...props} />;
}


