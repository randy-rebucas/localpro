import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/marketplace/bookings");

export const GET = proxy.GET;
export const POST = proxy.POST;
