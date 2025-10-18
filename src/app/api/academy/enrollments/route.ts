import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/academy/enrollments");

export const GET = proxy.GET;
export const POST = proxy.POST;
