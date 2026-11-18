// Loads the options of a taxonomy-like collection (blog categories, services, industries) for the filter checkboxes.
import { getEmDashCollection } from "emdash";
import type { CacheHint } from "emdash";

type Locale = "hu" | "en";

export interface FilterOption {
	/** Slug of the default locale, so the filter URLs are the same in every language */
	slug: string;
	label: string;
	/** Shared by the translations of the entry, used to match the entry stored in a reference field */
	group: string;
}

// The translation group exists on every entry at runtime but is missing from the generated collection types
export const translationGroupOf = (entry?: { data: object } | null) =>
	(entry?.data as { translationGroup?: string | null } | undefined)?.translationGroup ?? "";

// Slugs come from the default locale so the filter URLs are the same in every language, labels follow the page locale
export async function loadFilterOptions(
	collection: "blog_categories" | "services" | "industries",
	locale: Locale,
	hints: CacheHint[],
): Promise<FilterOption[]> {
	const query = (entryLocale: Locale) =>
		getEmDashCollection(collection, { locale: entryLocale, orderBy: { created_at: "asc" } });

	const { entries: defaults, cacheHint } = await query("hu");
	hints.push(cacheHint);

	let labels = new Map<string, string>();
	if (locale === "en") {
		const { entries: translated, cacheHint: translatedHint } = await query("en");
		hints.push(translatedHint);
		labels = new Map(translated.map((entry) => [translationGroupOf(entry), entry.data.title]));
	}

	return defaults.map((entry) => ({
		slug: entry.data.slug ?? "",
		label: labels.get(translationGroupOf(entry)) ?? entry.data.title,
		group: translationGroupOf(entry),
	}));
}
