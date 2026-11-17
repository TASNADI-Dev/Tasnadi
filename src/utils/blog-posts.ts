// Loads one page of blog posts (with category and author resolved), filtered by title search and categories, for the blog list and its "load more" partial.
import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { CacheHint } from "emdash";

export const POSTS_PER_PAGE = 12;

type Locale = "hu" | "en";

export interface BlogFilters {
	/** Text searched for in the post titles */
	q: string;
	/** Selected category slugs (Hungarian slugs, the same in every locale) */
	categories: string[];
}

export interface BlogCategory {
	slug: string;
	label: string;
	/** Shared by the translations of the category, used to match the category stored on a post */
	group: string;
}

// The translation group exists on every entry at runtime but is missing from the generated collection types
export const translationGroupOf = (entry?: { data: object } | null) =>
	(entry?.data as { translationGroup?: string | null } | undefined)?.translationGroup ?? "";

export function parseBlogFilters(params: URLSearchParams): BlogFilters {
	return {
		q: (params.get("q") ?? "").trim().slice(0, 100),
		categories: params.getAll("category"),
	};
}

export function parseOffset(value: string | null) {
	const offset = Number.parseInt(value ?? "", 10);
	return Number.isFinite(offset) && offset > 0 ? offset : 0;
}

// Lower-cases and strips accents so "arculat" finds "Arculat" and "arculát"
const normalize = (text: string) =>
	text
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase();

// Slugs come from the default locale so the filter URLs are the same in every language, labels follow the page locale
export async function loadCategories(locale: Locale, hints: CacheHint[]): Promise<BlogCategory[]> {
	const query = (entryLocale: Locale) =>
		getEmDashCollection("blog_categories", { locale: entryLocale, orderBy: { created_at: "asc" } });

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

async function loadAllPosts(entryLocale: Locale, hints: CacheHint[]) {
	const all = [];
	let cursor: string | undefined;
	do {
		const { entries, nextCursor, cacheHint } = await getEmDashCollection("posts", {
			locale: entryLocale,
			orderBy: { published_at: "desc" },
			limit: 100,
			cursor,
		});
		hints.push(cacheHint);
		all.push(...entries);
		cursor = nextCursor;
	} while (cursor);
	return all;
}

// The collection query does not resolve references, so each post is loaded again with them
async function loadWithReferences(entries: Awaited<ReturnType<typeof loadAllPosts>>, entryLocale: Locale, hints: CacheHint[]) {
	const posts = await Promise.all(
		entries
			.map((entry) => entry.data.slug)
			.filter((slug): slug is string => Boolean(slug))
			.map(async (slug) => {
				const { entry, cacheHint } = await getEmDashEntry("posts", slug, {
					locale: entryLocale,
					references: { category: true, author: true },
				});
				if (cacheHint) hints.push(cacheHint);
				return entry;
			}),
	);
	return posts.filter((post) => post != null);
}

export async function loadBlogPosts(locale: Locale, filters: BlogFilters, offset = 0) {
	const hints: CacheHint[] = [];
	// Posts are never shown in another language: a locale without posts has no blog page at all
	const entryLocale = locale;
	const categories = await loadCategories(locale, hints);

	// The category is a reference field, which the collection query cannot filter by, so posts are matched in code
	const activeCategories = categories.filter((category) => filters.categories.includes(category.slug));
	const needle = normalize(filters.q);

	const candidates = (await loadAllPosts(entryLocale, hints)).filter(
		(entry) => !needle || normalize(entry.data.title).includes(needle),
	);

	const withReferences = (entries: typeof candidates) => loadWithReferences(entries, entryLocale, hints);

	let matching: Awaited<ReturnType<typeof withReferences>>;
	let page: typeof matching;

	if (activeCategories.length > 0) {
		const groups = new Set(activeCategories.map((category) => category.group));
		matching = (await withReferences(candidates)).filter((post) =>
			groups.has(translationGroupOf(post.references?.category.entries[0])),
		);
		page = matching.slice(offset, offset + POSTS_PER_PAGE);
	} else {
		matching = [];
		page = await withReferences(candidates.slice(offset, offset + POSTS_PER_PAGE));
	}

	const total = activeCategories.length > 0 ? matching.length : candidates.length;
	const nextOffset = offset + POSTS_PER_PAGE < total ? offset + POSTS_PER_PAGE : undefined;

	return {
		posts: page,
		nextOffset,
		total,
		categories,
		activeCategories: activeCategories.map((category) => category.slug),
		hints,
	};
}

const RELATED_BATCH_SIZE = 12;

/** The latest posts in the same category as a post (the post itself excluded), for its "related articles" section */
export async function loadRelatedPosts(locale: Locale, current: { slug: string; categoryGroup: string }, limit = 3) {
	const hints: CacheHint[] = [];
	const related: Awaited<ReturnType<typeof loadWithReferences>> = [];
	if (!current.categoryGroup) return { posts: related, hints };

	const candidates = (await loadAllPosts(locale, hints)).filter(
		(entry) => entry.data.slug && entry.data.slug !== current.slug,
	);

	// Posts are newest first, so loading them in small batches stops as soon as enough of the same category are found
	for (let start = 0; start < candidates.length && related.length < limit; start += RELATED_BATCH_SIZE) {
		const batch = await loadWithReferences(candidates.slice(start, start + RELATED_BATCH_SIZE), locale, hints);
		related.push(...batch.filter((post) => translationGroupOf(post.references?.category.entries[0]) === current.categoryGroup));
	}

	return { posts: related.slice(0, limit), hints };
}
