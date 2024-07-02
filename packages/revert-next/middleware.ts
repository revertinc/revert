import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in", "/sign-up"]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

// Todo: configure the private routes
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/dashboard", "/oauth-callback/clickup"],
};
