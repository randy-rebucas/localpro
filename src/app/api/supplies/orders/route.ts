import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/supplies/orders");

export const GET = proxy.GET;
export const POST = proxy.POST;