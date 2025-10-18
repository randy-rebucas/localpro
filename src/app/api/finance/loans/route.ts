import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/finance/loans");

export const GET = proxy.GET;
export const POST = proxy.POST;
