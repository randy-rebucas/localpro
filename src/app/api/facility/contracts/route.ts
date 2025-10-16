import { createApiProxy } from "@/lib/api-proxy";

const proxy = createApiProxy("/api/facility/contracts");

export const GET = proxy.GET;
export const POST = proxy.POST;