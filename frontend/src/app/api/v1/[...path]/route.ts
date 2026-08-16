import { relayApiRequest } from "@/lib/server/api-gateway";

type ApiRouteContext = Readonly<{ params: Promise<{ path: string[] }> }>;

async function relay(request: Request, context: ApiRouteContext): Promise<Response> {
  return relayApiRequest(request, (await context.params).path);
}

export const GET = relay;
export const POST = relay;
export const PATCH = relay;
export const DELETE = relay;
