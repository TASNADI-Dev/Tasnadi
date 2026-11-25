// Collects every public URL (static Astro pages + published CMS entries) for /sitemap.xml and /sitemap.
import { getEmDashCollection, SchemaRegistry } from "emdash";
import type { ContentEntry } from "emdash";
import { getDb } from "emdash/runtime";
import { DEFAULT_LOCALE, LOCALES, localizePath, type Locale } from "../i18n/routes";
import { getPageAlternates } from "./locale-content";

export interface SitemapUrl {
	/** Public path, e.g. `/esettanulmanyok/my-case`, `/blog/my-post` or `/en` */
	path: string;
	title: string;
	locale: string;
	lastmod?: string;
	/** Same page in every locale it exists in, keyed by locale */
	alternates: Partial<Record<string, string>>;
}

export interface SitemapGroup {
	key: string;
	label: { hu: string; en: string };
	urls: SitemapUrl[];
}

const COLLECTION_LABELS: Record<string, { hu: string; en: string }> = {
	pages: { hu: "Oldalak", en: "Pages" },
	posts: { hu: "Blog", en: "Blog" },
	case_studies: { hu: "Esettanulmányok", en: "Case studies" },
	podcasts: { hu: "Podcast", en: "Podcast" },
	services: { hu: "Szolgáltatások", en: "Services" },
	industries: { hu: "Iparágak", en: "Industries" },
	team_members: { hu: "Csapat", en: "Team" },
};

/** Titles by internal path */
const STATIC_PAGE_TITLES: Record<string, { hu: string; en: string }> = {
	"/": { hu: "Főoldal", en: "Home" },
	"/about": { hu: "Rólunk", en: "About" },
	"/contact": { hu: "Kapcsolat", en: "Contact" },
	"/services": { hu: "Szolgáltatásaink", en: "Services" },
	"/projects": { hu: "Munkáink", en: "Work" },
	"/blog": { hu: "Blog", en: "Blog" },
	"/podcast": { hu: "Podcast", en: "Podcast" },
};

// Every .astro file under src/pages is picked up automatically; dynamic routes, the 404 page,
// the dev tools, the sitemap page itself and the en/ copies (the same page in English) are skipped.
const pageFiles = Object.keys(import.meta.glob("/src/pages/**/*.astro"));
const EXCLUDED_STATIC = /(\[|^\/src\/pages\/(404|sitemap|dev\/|partials\/|en\/))/;

function humanize(slug: string) {
	const text = slug.split("/").pop()?.replace(/[-_]/g, " ") ?? slug;
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function toIsoDate(value: unknown): string | undefined {
	if (!value) return undefined;
	const date = value instanceof Date ? value : new Date(String(value));
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Static pages from src/pages, in every language they are available in, at their localized URLs. */
async function getStaticPages(): Promise<SitemapUrl[]> {
	const routes = pageFiles
		.filter((file) => !EXCLUDED_STATIC.test(file))
		.map((file) => file.replace("/src/pages", "").replace(/\.astro$/, "").replace(/\/?index$/, "") || "/")
		.sort((a, b) => a.localeCompare(b));

	const urls: SitemapUrl[] = [];
	for (const route of routes) {
		const alternates = await getPageAlternates(route);
		for (const locale of LOCALES) {
			const path = alternates[locale];
			if (!path) continue;
			const titles = STATIC_PAGE_TITLES[route];
			urls.push({ path, title: titles?.[locale] ?? titles?.hu ?? humanize(route), locale, alternates });
		}
	}
	return urls;
}

/** Fetches all published entries of a collection in every locale, following the pagination cursor. */
async function getPublishedEntries(collection: string, locales: string[]) {
	const entries: ContentEntry<Record<string, unknown>>[] = [];
	for (const locale of locales) {
		let cursor: string | undefined;
		do {
			const result = await getEmDashCollection<string, Record<string, unknown>>(collection, { limit: 500, cursor, locale });
			entries.push(...result.entries);
			cursor = result.nextCursor;
		} while (cursor);
	}
	return entries;
}

export async function getSitemapGroups(): Promise<SitemapGroup[]> {
	const groups: SitemapGroup[] = [
		{
			key: "static",
			label: { hu: "Oldalak", en: "Pages" },
			urls: await getStaticPages(),
		},
	];

	const db = await getDb();
	const collections = await new SchemaRegistry(db).listCollections();

	// Entries with "Hide from search engines" ticked in the SEO panel
	const hiddenRows = await db
		.selectFrom("_emdash_seo")
		.select(["collection", "content_id"])
		.where("seo_no_index", "=", 1)
		.execute();
	const hidden = new Set(hiddenRows.map((row) => `${row.collection}:${row.content_id}`));

	for (const collection of collections) {
		if (collection.routable === false || !collection.urlPattern) continue;
		const urlPattern = collection.urlPattern;

		const entries = (await getPublishedEntries(collection.slug, LOCALES)).filter(
			(entry) => !hidden.has(`${collection.slug}:${entry.data.id}`),
		);

		// Group translations so every locale version lists its siblings as alternates
		const byGroup = new Map<string, typeof entries>();
		for (const entry of entries) {
			const key = String(entry.data.translationGroup ?? entry.data.id);
			byGroup.set(key, [...(byGroup.get(key) ?? []), entry]);
		}

		const urls: SitemapUrl[] = [];
		for (const siblings of byGroup.values()) {
			const alternates: Record<string, string> = {};
			for (const entry of siblings) {
				const locale = (entry.data.locale ?? DEFAULT_LOCALE) as Locale;
				alternates[locale] = localizePath(urlPattern.replace("{slug}", String(entry.data.slug ?? entry.id)), locale);
			}
			for (const entry of siblings) {
				const locale = String(entry.data.locale ?? DEFAULT_LOCALE);
				urls.push({
					path: alternates[locale],
					title: String(entry.data.title ?? entry.data.slug ?? entry.id),
					locale,
					lastmod: toIsoDate(entry.data.updatedAt ?? entry.data.updated_at),
					alternates,
				});
			}
		}

		if (urls.length === 0) continue;

		groups.push({
			key: collection.slug,
			label: COLLECTION_LABELS[collection.slug] ?? { hu: collection.label, en: collection.label },
			urls: urls.sort((a, b) => a.title.localeCompare(b.title, "hu")),
		});
	}

	return groups;
}
