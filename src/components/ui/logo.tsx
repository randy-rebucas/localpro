import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
	withText?: boolean;
	size?: number; // square size in px
	className?: string;
}

export function Logo({ withText = false, size = 40, className }: LogoProps) {
	return (
		<Link href="/dashboard" className={cn("flex items-center", className)}>
			<Image
				src="/next.svg"
				alt="LocalPro logo"
				width={size}
				height={size}
				priority
				className="rounded-md object-contain"
			/>
			{withText && (
				<span className="ml-3 text-xl font-semibold text-gray-700">LocalPro Super App</span>
			)}
		</Link>
	);
}


