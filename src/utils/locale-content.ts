// Tells whether a CMS collection has published entries in a locale, so Hungarian-only sections can be hidden from the English site instead of falling back to Hungarian content.
import { getEmDashCollection } from "emdash";

type Locale = "hu" | "en";

const DEFAULT_LOCALE: Locale = "hu";

/** Site sections whose pages only make sense in a locale that has entries in the collection */
const SECTION_COLLECTIONS: Record<string, string> = {
	"/projects": "case_studies",
	"/blog": "posts",
	"/podcast": "podcasts",
};

/** Collections that are only published in the default locale, whatever the CMS holds in other locales */
const DEFAULT_LOCALE_ONLY = new Set(["podcasts"]);

export async function hasLocaleContent(collection: string, locale: Locale) {
	if (locale === DEFAULT_LOCALE) return true;
	if (DEFAULT_LOCALE_ONLY.has(collection)) return false;
	const { entries } = await getEmDashCollection(collection, { locale, limit: 1 });
	return entries.length > 0;
}

/** `path` has no locale prefix, e.g. `/blog` or `/blog/my-post` */
export async function isPathAvailable(path: string, locale: Locale) {
	const section = Object.keys(SECTION_COLLECTIONS).find(
		(prefix) => path === prefix || path.startsWith(`${prefix}/`),
	);
	return section ? hasLocaleContent(SECTION_COLLECTIONS[section], locale) : true;
}
