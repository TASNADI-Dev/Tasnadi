// Rewrites a request to the 404 page in the visitor's language, so /en/... paths keep the English site and menu.
import type { AstroGlobal } from "astro";

export function rewriteToNotFound(Astro: AstroGlobal) {
	return Astro.rewrite(Astro.currentLocale === "en" ? "/en/404" : "/404");
}
