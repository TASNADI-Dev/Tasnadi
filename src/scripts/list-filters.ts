// Applies a list's filters (search field and checkboxes) without reloading the page: fetches the filtered results, swaps them in and updates the address bar.
const form = document.querySelector<HTMLFormElement>("[data-list-filters]");
const resultsSelector = "[data-list-results]";
const searchDelay = 350;

let controller: AbortController | undefined;
let searchTimer: number | undefined;

const fields = [...(form?.querySelectorAll<HTMLInputElement>("input[name]") ?? [])];
const checkboxes = fields.filter((field) => field.type === "checkbox");
const search = fields.find((field) => field.type === "search");
const currentUrl = () => `${location.pathname}${location.search}`;

function urlFromForm() {
	const params = new URLSearchParams();
	if (search?.value.trim()) params.set(search.name, search.value.trim());
	checkboxes.filter((box) => box.checked).forEach((box) => params.append(box.name, box.value));
	const queryString = params.toString();
	return `${location.pathname}${queryString ? `?${queryString}` : ""}`;
}

function syncFormWithUrl() {
	const params = new URLSearchParams(location.search);
	if (search) search.value = params.get(search.name) ?? "";
	checkboxes.forEach((box) => (box.checked = params.getAll(box.name).includes(box.value)));
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
	if ((event.target as HTMLInputElement).type === "checkbox") apply(urlFromForm());
});

search?.addEventListener("input", () => {
	window.clearTimeout(searchTimer);
	searchTimer = window.setTimeout(() => apply(urlFromForm()), searchDelay);
});

form?.querySelector("[data-list-reset]")?.addEventListener("click", (event) => {
	event.preventDefault();
	if (search) search.value = "";
	checkboxes.forEach((box) => (box.checked = false));
	apply(urlFromForm());
});

window.addEventListener("popstate", () => {
	syncFormWithUrl();
	apply(currentUrl(), false);
});
