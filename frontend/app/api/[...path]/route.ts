import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return Response.json(
      { detail: "Backend service is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  let target: URL;
  try {
    const { path } = await params;
    target = new URL(`/api/${path.join("/")}`, backendUrl);
    target.search = request.nextUrl.search;
  } catch {
    return Response.json(
      { detail: "Backend service URL is invalid" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  headers.delete("host");

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      // Required by Node's fetch implementation when a request stream is forwarded.
      // @ts-expect-error `duplex` is supported by Node but omitted from the DOM type.
      duplex: "half",
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstream.headers);
    for (const header of HOP_BY_HOP_HEADERS) responseHeaders.delete(header);
    // fetch() transparently decompresses the upstream body, but upstream.headers
    // still carries the original content-encoding/content-length (compressed
    // size). Forwarding those as-is describes a body that no longer matches
    // what's actually being sent, which made every non-trivial response body
    // arrive empty/truncated at the client. Let the runtime recompute both
    // from the real (decompressed) body.
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { detail: "Backend service is unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
