/** @type {import("next-sitemap").IConfig} */
// Uses NEXT_PUBLIC_URL when set (production/staging). Routes include marketing pages under app/(marketing).
const config = {
  siteUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  generateRobotsTxt: true,
};

module.exports = config;

