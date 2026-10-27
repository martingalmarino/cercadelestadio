import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "www.cercadelestadio.com";
const PREVIEW_HOST = /-git-.+\.vercel\.app$/i;

function requestHostname(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host");
  const raw =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.hostname;
  return raw.replace(/:\d+$/, "").toLowerCase();
}

function isPreviewHost(hostname: string) {
  return PREVIEW_HOST.test(hostname);
}

function withNoindex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

/**
 * En Next.js 16 el archivo de borde se llama proxy.ts (antes middleware.ts).
 * En producción, cualquier host que no sea el canónico responde 301, salvo previews.
 */
export function proxy(request: NextRequest) {
  const hostname = requestHostname(request);
  const production = process.env.VERCEL_ENV === "production";

  if (request.nextUrl.pathname === "/copyright") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/como-funciona";
    destination.hash = "creditos";
    if (production && hostname !== CANONICAL_HOST && !isPreviewHost(hostname)) {
      destination.protocol = "https:";
      destination.hostname = CANONICAL_HOST;
      destination.port = "";
    }
    return NextResponse.redirect(destination, 301);
  }

  if (!production) {
    return withNoindex(NextResponse.next());
  }

  if (hostname === CANONICAL_HOST || isPreviewHost(hostname)) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.hostname = CANONICAL_HOST;
  destination.port = "";
  return NextResponse.redirect(destination, 301);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
