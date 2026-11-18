// Loads the case studies (with services and industry resolved), filtered by selected services and industries, for the Projects page.
import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { CacheHint } from "emdash";
import { loadFilterOptions, translationGroupOf } from "./filter-options";

type Locale = "hu" | "en";

export interface ProjectFilters {
	/** Selected service slugs (Hungarian slugs, the same in every locale) */
	services: string[];
	/** Selected industry slugs (Hungarian slugs, the same in every locale) */
	industries: string[];
}

export function parseProjectFilters(params: URLSearchParams): ProjectFilters {
	return {
		services: params.getAll("service"),
		industries: params.getAll("industry"),
	};
}

export async function loadCaseStudies(locale: Locale, filters: ProjectFilters) {
	const hints: CacheHint[] = [];
	const [services, industries] = await Promise.all([
		loadFilterOptions("services", locale, hints),
		loadFilterOptions("industries", locale, hints),
	]);

	// Only valid options are kept, so a stale or edited URL cannot leave an invisible filter on
	const activeServices = services.filter((service) => filters.services.includes(service.slug));
	const activeIndustries = industries.filter((industry) => filters.industries.includes(industry.slug));

	const all = [];
	let cursor: string | undefined;
	do {
		const { entries, nextCursor, cacheHint } = await getEmDashCollection("case_studies", {
			locale,
			orderBy: { published_at: "desc" },
			limit: 100,
			cursor,
		});
		hints.push(cacheHint);
		all.push(...entries);
		cursor = nextCursor;
	} while (cursor);

	// The collection query does not resolve references (and cannot filter by them), so each case study is loaded again with them
	const withReferences = (
		await Promise.all(
			all
				.map((entry) => entry.data.slug)
				.filter((slug): slug is string => Boolean(slug))
				.map(async (slug) => {
					const { entry, cacheHint } = await getEmDashEntry("case_studies", slug, {
						locale,
						references: { services: true, industry: true },
					});
					if (cacheHint) hints.push(cacheHint);
					return entry;
				}),
		)
	).filter((entry) => entry != null);

	// Several selected options of one group match any of them, the two groups must both match
	const serviceGroups = new Set(activeServices.map((service) => service.group));
	const industryGroups = new Set(activeIndustries.map((industry) => industry.group));
	const caseStudies = withReferences.filter((entry) => {
		const matchesServices =
			serviceGroups.size === 0 ||
			(entry.references?.services.entries ?? []).some((service) => serviceGroups.has(translationGroupOf(service)));
		const matchesIndustry =
			industryGroups.size === 0 ||
			industryGroups.has(translationGroupOf(entry.references?.industry.entries[0]));
		return matchesServices && matchesIndustry;
	});

	return {
		caseStudies,
		services,
		industries,
		activeServices: activeServices.map((service) => service.slug),
		activeIndustries: activeIndustries.map((industry) => industry.slug),
		hints,
	};
}
