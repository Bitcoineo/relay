import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const isAuthPage = nextUrl.pathname.startsWith("/auth/");
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth/");

  // Never intercept API auth routes (NextAuth needs these)
  if (isApiAuthRoute) return;

  // Authenticated users shouldn't see signin/signup (but CAN see verify-email)
  if (isAuthPage && isAuthenticated) {
    if (nextUrl.pathname === "/auth/verify-email") return;
    return Response.redirect(new URL("/workspaces", nextUrl));
  }

  // Auth pages are publicly accessible
  if (isAuthPage) return;

  // Root page is public
  if (nextUrl.pathname === "/") return;

  // Invite pages are publicly accessible (shows "sign in to join" for unauth users)
  if (nextUrl.pathname.startsWith("/invite/")) return;

  // Everything else requires authentication
  if (!isAuthenticated) {
    return Response.redirect(new URL("/auth/signin", nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
