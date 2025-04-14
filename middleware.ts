// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get("authorization");

  if (basicAuth) {
    const [, base64] = basicAuth.split(" ");
    const [user, pwd] = atob(base64).split(":");

    if (
      user === process.env.AUTH_USERNAME &&
      pwd === process.env.AUTH_PASSWORD
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|public).*)"], // protect all except these
};
