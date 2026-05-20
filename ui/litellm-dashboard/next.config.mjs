import path from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  output: "export",
  // Required with output: "export" — default image optimizer runs only in server mode.
  // See https://nextjs.org/docs/messages/export-image-api
  images: {
    unoptimized: true,
  },
  basePath: "",
  // In dev the asset prefix breaks the dev server (assets served from localhost:3000
  // but prefixed to /litellm-asset-prefix/...). Strip it for local development.
  assetPrefix: isDev ? "" : "/litellm-asset-prefix",
  turbopack: {
    // Must be absolute; "." is no longer allowed
    root: __dirname,
  },
};

export default nextConfig;
