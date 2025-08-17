import authConfig from "@/auth.config";
import NextAuth from "next-auth";
import {
    DEFAULT_LOGIN_REDIRECT,
    apiAuthPrefix,
    authRoutes,
    dashboardPages,
    pendingApproval,
    publicRoutes,
} from "@/routes";
import { auth as sessionAuth } from "@/auth";

const { auth } = NextAuth(authConfig);

export default auth(async (req): Promise<any> => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);
    const session = await sessionAuth();

    if (isApiAuthRoute) return null;

    if (isAuthRoute) {
        if (isLoggedIn) {
            if (session?.user?.isApproved === false) {
                return Response.redirect(new URL(pendingApproval, nextUrl));
            }
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return null;
    }

    if (!isLoggedIn && !isPublicRoute) {
        let loginUrl = new URL("/auth/login", nextUrl);
        return Response.redirect(loginUrl);
    }

    if (nextUrl.pathname.startsWith(pendingApproval)) {
        if (session?.user?.isApproved === true) {
            const redirectUrl = new URL(DEFAULT_LOGIN_REDIRECT, nextUrl.origin);
            return Response.redirect(redirectUrl);
        }
    }

    if (dashboardPages.some((route) => nextUrl.pathname.startsWith(route))) {
        if (session?.user?.isApproved === false) {
            const redirectUrl = new URL(pendingApproval, nextUrl.origin);
            return Response.redirect(redirectUrl);
        }
    }

    // if (nextUrl.pathname.startsWith("/admin-dashboard")) {
    //     if (session?.user?.role === "USER") {
    //         const redirectUrl = new URL(
    //             "/supply-out-dashboard",
    //             nextUrl.origin
    //         );
    //         return Response.redirect(redirectUrl);
    //     }
    //     if (session?.user?.role === "APPROVER") {
    //         const redirectUrl = new URL("/requests-dashboard", nextUrl.origin);
    //         return Response.redirect(redirectUrl);
    //     }
    // }

    return null;
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
