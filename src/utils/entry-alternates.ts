// Public URL of a CMS entry in every language it is published in, for hreflang and the language switcher (each translation can have its own slug).
import { getTranslations } from "emdash";
import { LOCALES, localizePath, type Locale } from "../i18n/routes";

/** `pathOf` turns a slug into the internal path, e.g. `(slug) => \`/blog/${slug}\`` */
export async function getEntryAlternates(
	collection: string,
	entryId: string,
	pathOf: (slug: string) => string,
	locales: Locale[] = LOCALES,
) {
	const { translations } = await getTranslations(collection, entryId);
	const hrefs: Partial<Record<Locale, string>> = {};
	for (const translation of translations) {
		const locale = translation.locale as Locale;
		if (translation.status !== "published" || !translation.slug || !locales.includes(locale)) continue;
		hrefs[locale] = localizePath(pathOf(translation.slug), locale);
	}
	return hrefs;
}
