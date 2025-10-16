import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/finance/salary-advances");

export const GET = proxy.GET;
export const POST = proxy.POST;