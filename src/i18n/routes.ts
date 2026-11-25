// Maps every page's internal path (its file under src/pages, which is also its English URL without /en) to its Hungarian public URL, and converts between the two.
export type Locale = "hu" | "en";

export const DEFAULT_LOCALE: Locale = "hu";
export const LOCALES: Locale[] = ["hu", "en"];

/**
 * Internal path → Hungarian public path. The English URL is always `/en` + the internal path,
 * kept identical to the original tasnadi.co URLs. Hungarian slugs are lowercase ASCII without accents.
 * Pages missing here keep the same slug in both languages (e.g. `/blog`, `/podcast`).
 * `[slug]` stands for one path segment that is copied over unchanged.
 */
const HUNGARIAN_PATHS: Record<string, string> = {
	"/about": "/rolunk",
	"/contact": "/kapcsolat",
	"/method": "/modszer",
	"/case-studies": "/esettanulmanyok",
	"/services": "/szolgaltatasok",
	"/services/website": "/szolgaltatasok/weboldalak",
	"/services/website/website-design": "/szolgaltatasok/weboldalak/weboldal-tervezes",
	"/services/website/ux-ui-design": "/szolgaltatasok/weboldalak/ux-ui-tervezes",
	"/services/website/webflow-development": "/szolgaltatasok/weboldalak/webflow-fejlesztes",
	"/services/website/wordpress-development": "/szolgaltatasok/weboldalak/wordpress-fejlesztes",
	"/services/webshops": "/szolgaltatasok/webshopok",
	"/services/webshops/woocommerce-webshop": "/szolgaltatasok/webshopok/woocommerce-webshop",
	"/services/webshops/shopify-webshop": "/szolgaltatasok/webshopok/shopify-webshop",
	"/services/branding": "/szolgaltatasok/arculattervezes",
	"/services/consulting": "/szolgaltatasok/tanacsadas",
	"/privacy-policy": "/adatvedelmi-szabalyzat",
	"/gtc/current": "/aszf/aktualis",
	"/focus-areas/partnerships": "/fokusz/partnersegek",
	"/downloads/design-your-brand": "/letoltesek/tervezd-meg-a-markad",
	"/downloads/webshop-guide": "/letoltesek/webaruhaz-fejlesztes-utmutato",
	"/case-studies/[slug]": "/esettanulmanyok/[slug]",
};

/**
 * Old internal path → its replacement. The original site's `/projects` section is merged into case studies,
 * so these paths redirect in every language (`/projects` → `/en/case-studies`, `/hu/projects` → `/esettanulmanyok`).
 */
const LEGACY_PATHS: Record<string, string> = {
	"/projects": "/case-studies",
	"/projects/[slug]": "/case-studies/[slug]",
};

type RoutePair = { internal: RegExp; hungarian: RegExp; internalPath: string; hungarianPath: string };

const toPattern = (path: string) =>
	new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\[slug\\]", "([^/]+)")}$`);

const ROUTES: RoutePair[] = Object.entries(HUNGARIAN_PATHS).map(([internalPath, hungarianPath]) => ({
	internal: toPattern(internalPath),
	hungarian: toPattern(hungarianPath),
	internalPath,
	hungarianPath,
}));

const fill = (path: string, slug?: string) => (slug === undefined ? path : path.replace("[slug]", slug));

function withoutTrailingSlash(path: string) {
	return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** Splits `/en/about` into `{ locale: "en", rest: "/about" }`; unprefixed paths are Hungarian. */
function splitLocale(pathname: string): { locale: Locale; rest: string } {
	const match = pathname.match(/^\/en(\/.*)?$/);
	return match ? { locale: "en", rest: match[1] || "/" } : { locale: DEFAULT_LOCALE, rest: pathname };
}

const LEGACY_ROUTES = Object.entries(LEGACY_PATHS).map(([oldPath, newPath]) => ({
	pattern: toPattern(oldPath),
	newPath,
}));

function legacyToInternal(path: string) {
	for (const route of LEGACY_ROUTES) {
		const match = path.match(route.pattern);
		if (match) return fill(route.newPath, match[1]);
	}
	return null;
}

function internalToHungarian(path: string) {
	for (const route of ROUTES) {
		const match = path.match(route.internal);
		if (match) return fill(route.hungarianPath, match[1]);
	}
	return null;
}

function hungarianToInternal(path: string) {
	for (const route of ROUTES) {
		const match = path.match(route.hungarian);
		if (match) return fill(route.internalPath, match[1]);
	}
	return null;
}

/**
 * Public URL of a page in a language. `path` is the internal path (`/about`, `/case-studies/my-case`),
 * optionally with a query string or hash.
 */
export function localizePath(path: string, locale: Locale) {
	const [, pathname = "/", suffix = ""] = path.match(/^([^?#]*)(.*)$/) ?? [];
	const internal = withoutTrailingSlash(pathname || "/");
	if (locale === "en") return `${internal === "/" ? "/en" : `/en${internal}`}${suffix}`;
	return `${internalToHungarian(internal) ?? internal}${suffix}`;
}

/** Internal path of a public or internal pathname (works before and after a rewrite). */
export function toInternalPath(pathname: string) {
	const { locale, rest } = splitLocale(withoutTrailingSlash(pathname));
	return locale === "en" ? rest : (hungarianToInternal(rest) ?? rest);
}

/**
 * Language and internal path of the page being rendered. After a rewrite `Astro.url` holds the internal path
 * (English pages too), so the language comes from `Astro.currentLocale`.
 */
export function currentPage(url: URL, currentLocale: string | undefined): { locale: Locale; path: string } {
	return { locale: currentLocale === "en" ? "en" : "hu", path: toInternalPath(url.pathname) };
}

export type RouteAction =
	| { type: "rewrite"; path: string }
	| { type: "redirect"; location: string }
	| null;

/**
 * What the middleware does with a request path:
 * - a Hungarian slug is rewritten to the internal page (`/rolunk` → `/about`);
 * - an old English URL from the root goes to `/en` (`/about` → `/en/about`);
 * - an old `/hu/...` URL goes to the Hungarian slug (`/hu/about` → `/rolunk`);
 * - a slug in the wrong language is corrected (`/en/rolunk` → `/en/about`).
 */
export function routeAction(pathname: string): RouteAction {
	const path = withoutTrailingSlash(pathname);

	const legacyHungarian = path.match(/^\/hu(\/.*)?$/);
	if (legacyHungarian) {
		const rest = legacyHungarian[1] || "/";
		const internal = legacyToInternal(rest) ?? hungarianToInternal(rest) ?? rest;
		return { type: "redirect", location: localizePath(internal, "hu") };
	}

	const { locale, rest } = splitLocale(path);
	const replacement = legacyToInternal(rest);
	if (replacement) {
		// Unprefixed old URLs were English on the original site
		return { type: "redirect", location: localizePath(replacement, "en") };
	}

	if (locale === "en") {
		if (internalToHungarian(rest) !== null) return null;
		const internal = hungarianToInternal(rest);
		return internal ? { type: "redirect", location: localizePath(internal, "en") } : null;
	}

	const internal = hungarianToInternal(rest);
	if (internal && internal !== rest) return { type: "rewrite", path: internal };
	const hungarian = internalToHungarian(rest);
	if (hungarian && hungarian !== rest) return { type: "redirect", location: localizePath(rest, "en") };
	return null;
}
