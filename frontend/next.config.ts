import type { NextConfig } from "next";

// Server-side only (no NEXT_PUBLIC_ prefix) URL of the backend API, e.g.
// https://workout-log-api.onrender.com. Set in the Vercel project's
// environment variables (a different value for the staging and production
// environments). Left undefined locally, where the frontend talks to the
// backend directly via NEXT_PUBLIC_API_URL instead of this proxy.
const backendApiUrl = process.env.BACKEND_API_URL;

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Proxies "/api/*" requests to the backend so the browser only ever talks
  // to the frontend's own origin. Without this, the frontend (Vercel) and
  // backend (Render) are different sites, which makes the auth cookie a
  // cross-site cookie - something iOS Safari and Chrome-for-iOS (both built
  // on WebKit) block by default via Intelligent Tracking Prevention, even
  // when the cookie is SameSite=None; Secure. Proxying makes the cookie
  // first-party, avoiding that restriction entirely.
  async rewrites() {
    if (!backendApiUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
