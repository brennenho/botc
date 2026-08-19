import { withPostHogConfig } from "@posthog/nextjs-config";

import { env } from "./src/env.js";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=()",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];

const deploymentNoIndexHeaders =
  process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production"
    ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
    : [];

/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.botc.town" }],
        destination: "https://botc.town/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    const noIndexHeader = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: noIndexHeader },
      { source: "/game/:path*", headers: noIndexHeader },
      { source: "/join/:path*", headers: noIndexHeader },
      ...(deploymentNoIndexHeaders.length
        ? [{ source: "/:path*", headers: deploymentNoIndexHeaders }]
        : []),
    ];
  },
};

const personalApiKey = env.POSTHOG_API_KEY;
const projectId = env.POSTHOG_PROJECT_ID;
const observabilityDisabled = env.NEXT_PUBLIC_DISABLE_OBSERVABILITY === "true";
const sourceMapCredentials = [personalApiKey, projectId];
const hasCompleteSourceMapConfig = sourceMapCredentials.every(Boolean);
const postHogCliHost =
  env.POSTHOG_CLI_HOST ??
  env.NEXT_PUBLIC_POSTHOG_HOST?.replace("://us.i.", "://us.").replace(
    "://eu.i.",
    "://eu.",
  );

if (
  !observabilityDisabled &&
  sourceMapCredentials.some(Boolean) &&
  !hasCompleteSourceMapConfig
) {
  throw new Error(
    "POSTHOG_API_KEY and POSTHOG_PROJECT_ID must be configured together.",
  );
}

const productionConfig =
  !observabilityDisabled && personalApiKey && projectId
    ? withPostHogConfig(config, {
        host: postHogCliHost,
        personalApiKey,
        projectId,
        sourcemaps: {
          deleteAfterUpload: true,
          enabled: true,
          releaseName: "botc",
        },
      })
    : config;

export default productionConfig;
