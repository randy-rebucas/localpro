import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/rentals/items");

export const GET = proxy.GET;
export const POST = proxy.POST;