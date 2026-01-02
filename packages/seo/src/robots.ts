export interface RobotsTxtConfig {
  /** Base URL of the app for sitemap reference */
  appUrl: string;
  /** Paths to disallow (e.g., ["/en/dashboard", "/es/admin"]) */
  disallowPaths?: string[];
  /** Additional rules as raw text */
  additionalRules?: string;
}

/**
 * Generates robots.txt content for the app.
 * Use this to create a robots.txt file in the public folder.
 *
 * @example
 * // Example output:
 * // # https://www.robotstxt.org/robotstxt.html
 * // User-agent: *
 * // Allow: /
 * //
 * // # Private content
 * // Disallow: /en/dashboard
 * //
 * // # Sitemaps
 * // Sitemap: https://myapp.com/sitemap.xml
 */
export function generateRobotsTxt(config: RobotsTxtConfig): string {
  const { appUrl, disallowPaths = [], additionalRules } = config;

  const lines = [
    "# https://www.robotstxt.org/robotstxt.html",
    "User-agent: *",
    "Allow: /",
    "",
  ];

  if (disallowPaths.length > 0) {
    lines.push("# Private/dynamic content - don't index");
    for (const path of disallowPaths) {
      lines.push(`Disallow: ${path}`);
    }
    lines.push("");
  }

  if (additionalRules) {
    lines.push(additionalRules);
    lines.push("");
  }

  lines.push("# Sitemaps");
  lines.push(`Sitemap: ${appUrl}/sitemap.xml`);
  lines.push("");

  return lines.join("\n");
}
