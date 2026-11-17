// Applies the blog filters without reloading the page: fetches the filtered results, swaps them in and updates the address bar.
const form = document.querySelector<HTMLFormElement>("[data-blog-filters]");
const resultsSelector = "[data-blog-results]";
const searchDelay = 350;

let controller: AbortController | undefined;
let searchTimer: number | undefined;

const search = form?.querySelector<HTMLInputElement>('input[name="q"]');
const checkboxes = [...(form?.querySelectorAll<HTMLInputElement>('input[name="category"]') ?? [])];
const currentUrl = () => `${location.pathname}${location.search}`;

function urlFromForm() {
	const params = new URLSearchParams();
	const query = search?.value.trim();
	if (query) params.set("q", query);
	checkboxes.filter((box) => box.checked).forEach((box) => params.append("category", box.value));
	const queryString = params.toString();
	return `${location.pathname}${queryString ? `?${queryString}` : ""}`;
}

function syncFormWithUrl() {
	const params = new URLSearchParams(location.search);
	if (search) search.value = params.get("q") ?? "";
	const selected = params.getAll("category");
	checkboxes.forEach((box) => (box.checked = selected.includes(box.value)));
}

async function apply(url: string, pushHistory = true) {
	window.clearTimeout(searchTimer);
	if (pushHistory && url === currentUrl()) return;

	controller?.abort();
	controller = new AbortController();
	document.querySelector(resultsSelector)?.setAttribute("data-loading", "true");

	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) throw new Error(String(response.status));

		const page = new DOMParser().parseFromString(await response.text(), "text/html");
		const fresh = page.querySelector(resultsSelector);
		const current = document.querySelector(resultsSelector);
		if (!fresh || !current) throw new Error("Results not found");

		current.replaceWith(fresh);
		if (pushHistory) history.pushState(null, "", url);
	} catch (error) {
		if ((error as Error).name === "AbortError") return;
		// Anything unexpected falls back to a normal page load
		location.href = url;
	}
}

form?.addEventListener("submit", (event) => {
	event.preventDefault();
	apply(urlFromForm());
});

form?.addEventListener("change", (event) => {
	if ((event.target as HTMLInputElement).name === "category") apply(urlFromForm());
});

search?.addEventListener("input", () => {
	window.clearTimeout(searchTimer);
	searchTimer = window.setTimeout(() => apply(urlFromForm()), searchDelay);
});

form?.querySelector("[data-blog-reset]")?.addEventListener("click", (event) => {
	event.preventDefault();
	if (search) search.value = "";
	checkboxes.forEach((box) => (box.checked = false));
	apply(urlFromForm());
});

window.addEventListener("popstate", () => {
	syncFormWithUrl();
	apply(currentUrl(), false);
});
