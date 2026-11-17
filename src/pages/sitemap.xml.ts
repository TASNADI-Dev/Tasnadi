// Serves /sitemap.xml: one flat list of every public page, generated from the CMS on each request.
import type { APIRoute } from "astro";
import { getSiteSettings } from "emdash";
import { getSitemapGroups } from "../utils/sitemap";

export const prerender = false;

const escapeXml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ url, request, redirect }) => {
	// People opening the file in a browser get the readable page; crawlers never send this header.
	if (request.headers.get("sec-fetch-dest") === "document") {
		return redirect("/sitemap", 302);
	}

	const settings = await getSiteSettings();
	const origin = (settings?.url || import.meta.env.EMDASH_SITE_URL || url.origin).replace(/\/$/, "");
	const groups = await getSitemapGroups();
	const urls = groups.flatMap((group) => group.urls);

	const lines = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
	];

	for (const item of urls) {
		lines.push("  <url>", `    <loc>${escapeXml(origin + item.path)}</loc>`);
		if (item.lastmod) lines.push(`    <lastmod>${item.lastmod}</lastmod>`);

		const alternates = Object.entries(item.alternates);
		if (alternates.length > 1) {
			for (const [locale, path] of alternates) {
				lines.push(
					`    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(origin + path)}" />`,
				);
			}
			const defaultPath = item.alternates.hu ?? alternates[0][1];
			lines.push(
				`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(origin + defaultPath)}" />`,
			);
		}
		lines.push("  </url>");
	}
	lines.push("</urlset>");

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
			Vary: "Sec-Fetch-Dest",
		},
	});
};
