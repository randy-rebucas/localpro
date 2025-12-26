import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
	withText?: boolean;
	size?: number; // square size in px
	className?: string;
	href?: string; // optional href to make logo clickable
}

export function Logo({ withText = false, size = 40, className, href }: LogoProps) {
	const logoContent = (
		<>
			<Image
				src="/logo-only.svg"
				alt="LocalPro logo"
				width={size}
				height={size}
				priority
				className="rounded-md object-contain"
				unoptimized
			/>
			{withText && (
				<span className="ml-3 text-xl font-semibold text-foreground">LocalPro Super App</span>
			)}
		</>
	);

	if (href) {
		return (
			<Link href={href} className={cn("flex items-center", className)}>
				{logoContent}
			</Link>
		);
	}

	return (
		<div className={cn("flex items-center", className)}>
			{logoContent}
		</div>
	);
}


