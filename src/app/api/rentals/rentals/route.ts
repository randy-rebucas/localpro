import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/rentals/rentals");

export const GET = proxy.GET;
export const POST = proxy.POST;
