import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/plus/subscriptions");

export const GET = proxy.GET;
export const POST = proxy.POST;