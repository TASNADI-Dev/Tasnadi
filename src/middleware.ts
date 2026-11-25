// Serves Hungarian slugs from the internal (English-named) pages and 301-redirects old and wrong-language URLs, using the route map in src/i18n/routes.ts.
import { defineMiddleware } from "astro:middleware";
import { routeAction } from "./i18n/routes";

/** Admin, API, image, build and server-island paths, and any file request */
const SKIPPED_PATH = /^\/(_emdash|_image|_astro|_server-islands|@)|\.\w{1,10}$/;

const withoutTrailingSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

export const onRequest = defineMiddleware((context, next) => {
	const { pathname, search } = context.url;
	// Rewrites (ours, Astro's English fallback, the 404 page) run the middleware again; only the visitor's own URL is handled
	const isRewrite = withoutTrailingSlash(context.originPathname) !== withoutTrailingSlash(pathname);
	if (isRewrite || SKIPPED_PATH.test(pathname)) return next();

	const action = routeAction(pathname);
	if (!action) return next();

	if (action.type === "redirect") {
		return context.redirect(`${action.location}${search}`, 301);
	}
	return next(`${action.path}${search}`);
});
