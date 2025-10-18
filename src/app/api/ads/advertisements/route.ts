import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/ads/advertisements");

export const GET = proxy.GET;
export const POST = proxy.POST;
