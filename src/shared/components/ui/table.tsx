import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
	return (
		<div className="overflow-x-auto">
			<table className={cn("min-w-full divide-y divide-border", className)} {...props} />
		</div>
	);
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
	return <thead className={cn("bg-muted/50", className)} {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
	return <tr className={cn("hover:bg-muted/50", className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className={cn(
				"px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
				className
			)}
			{...props}
		/>
	);
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
	return <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-foreground", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody className={cn("bg-background divide-y divide-border", className)} {...props} />;
}

export function TableEmptyRow({ colSpan = 1, children }: { colSpan?: number; children?: React.ReactNode }) {
	return (
		<tr>
			<td colSpan={colSpan} className="px-6 py-12">
				<div className="text-center text-sm text-muted-foreground">{children || "No data to display"}</div>
			</td>
		</tr>
	);
}


