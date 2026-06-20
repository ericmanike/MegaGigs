import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

let ordersClosedCache: { value: boolean; expiresAt: number } | null = null;

async function getOrdersClosedFlag(req: Request): Promise<boolean> {
    const now = Date.now();
    if (ordersClosedCache && now < ordersClosedCache.expiresAt) {
        return ordersClosedCache.value;
    }

    try {
        const url = new URL("/api/settings/orders-closed", req.url);
        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const value = Boolean((data as any)?.ordersClosed);
        ordersClosedCache = { value, expiresAt: now + 10_000 };
        return value;
    } catch {
        ordersClosedCache = { value: false, expiresAt: now + 5_000 };
        return false;
    }
}

export default withAuth(
    async function proxy(req) {
        // req.nextauth.token is automatically populated by withAuth
        const token = req.nextauth.token;
        const role = token?.role;
        // console.log(token)
        // console.log(role)
        const pathname = req.nextUrl.pathname;
       


        // 1. Protect Admin Routes: Redirect non-admins to dashboard
        if (pathname.startsWith("/admin") && role !== "admin") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        if (pathname.startsWith("/dashboard/store") && role == "user") {
            return NextResponse.redirect(new URL("/dashboard/upgrade", req.url));
        }
 
       

        // 2. Orders closed: block buy flow for non-admins
        if (pathname.startsWith("/") && role !== "admin") {
            const ordersClosed = await getOrdersClosedFlag(req);
            if (ordersClosed) {
                return NextResponse.redirect(new URL("/orders-closed", req.url));
            }
        }

  

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/profile/:path*",
        "/history/:path*"
    ],
};
