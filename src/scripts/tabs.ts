// Makes any [data-tabs] block an accessible tab widget (WAI-ARIA tabs pattern): roving tabindex, arrow/Home/End keys, hidden panels.
const DESKTOP = "(min-width: 64rem)";

export function initTabs(root: HTMLElement) {
	const list = root.querySelector<HTMLElement>('[role="tablist"]');
	const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
	if (!list || tabs.length === 0) return;

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const desktop = window.matchMedia(DESKTOP);
	const panelOf = (tab: HTMLElement) =>
		document.getElementById(tab.getAttribute("aria-controls") ?? "");

	const select = (tab: HTMLElement, { focus = false } = {}) => {
		for (const other of tabs) {
			const selected = other === tab;
			other.setAttribute("aria-selected", String(selected));
			other.tabIndex = selected ? 0 : -1;
			const panel = panelOf(other);
			if (panel) panel.hidden = !selected;
		}
		if (focus) tab.focus();
		// When the tabs sit in a scrolling row (mobile), keep the selected one centred
		if (list.scrollWidth > list.clientWidth) {
			const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
			list.scrollTo({ left, behavior: reduceMotion.matches ? "auto" : "smooth" });
		}
	};

	// The tabs are a column on desktop and a row on mobile, so the orientation follows the layout
	const syncOrientation = () =>
		list.setAttribute("aria-orientation", desktop.matches ? "vertical" : "horizontal");
	syncOrientation();
	desktop.addEventListener("change", syncOrientation);

	tabs.forEach((tab, index) => {
		tab.addEventListener("click", () => select(tab));
		tab.addEventListener("keydown", (event) => {
			const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
			let next: number | undefined;
			if (step) next = (index + step + tabs.length) % tabs.length;
			else if (event.key === "Home") next = 0;
			else if (event.key === "End") next = tabs.length - 1;
			if (next === undefined) return;
			event.preventDefault();
			select(tabs[next], { focus: true });
		});
	});

	const initial = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
	select(initial);
}
