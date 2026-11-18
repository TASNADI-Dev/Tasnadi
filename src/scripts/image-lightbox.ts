// Opens the images of every [data-lightbox] gallery in one PhotoSwipe lightbox, with the site's round arrow buttons.
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import { sliderArrowClass } from "../utils/slider-arrow";

const arrowIcons = {
	prev: `<svg width="23" height="15" viewBox="0 0 23 15" fill="currentColor" aria-hidden="true"><path d="M21.387 8.451a1 1 0 0 0 0-2v2ZM1.2 6.744a1 1 0 0 0 0 1.414l6.364 6.364a1 1 0 0 0 1.414-1.414L3.32 7.451l5.657-5.657A1 1 0 0 0 7.563.38L1.2 6.744Zm20.187-.293H1.906v2h19.48v-2Z"></path></svg>`,
	next: `<svg width="23" height="15" viewBox="0 0 23 15" fill="currentColor" aria-hidden="true"><path d="M1.906 6.451a1 1 0 0 0 0 2v-2Zm20.188 1.707a1 1 0 0 0 0-1.414L15.73.38a1 1 0 0 0-1.414 1.414l5.657 5.657-5.657 5.657a1 1 0 0 0 1.414 1.414l6.364-6.364ZM1.906 8.451h19.48v-2H1.906v2Z"></path></svg>`,
};

// Very tall screenshots are shown at a readable width and scrolled, every other image fits the screen
type Point = { x: number; y: number };
const initialZoomLevel = ({ elementSize, panAreaSize, fit }: { elementSize: Point | null; panAreaSize: Point | null; fit: number }) => {
	if (!elementSize || !panAreaSize || elementSize.y / elementSize.x < 2) return fit;
	return Math.max(fit, Math.min(1, Math.min(panAreaSize.x, 1000) / elementSize.x));
};

document.querySelectorAll<HTMLElement>("[data-lightbox]").forEach((gallery) => {
	const { closeLabel, prevLabel, nextLabel } = gallery.dataset;

	const lightbox = new PhotoSwipeLightbox({
		gallery,
		children: "a",
		pswpModule: () => import("photoswipe"),
		initialZoomLevel,
		zoom: false,
		imageClickAction: false,
		doubleTapAction: false,
		showHideAnimationType: "fade",
		bgOpacity: 0.92,
		arrowPrev: false,
		arrowNext: false,
		closeTitle: closeLabel,
	});

	// A scrolled (tall) screenshot starts at its top instead of its middle
	lightbox.on("firstZoomPan", ({ slide }) => {
		slide.pan.y = slide.bounds.min.y;
	});

	lightbox.on("uiRegister", () => {
		const ui = lightbox.pswp?.ui;
		if (!ui) return;

		const arrows = [
			{ name: "prev-arrow", label: prevLabel, icon: arrowIcons.prev, side: "left-4", go: "prev" },
			{ name: "next-arrow", label: nextLabel, icon: arrowIcons.next, side: "right-4", go: "next" },
		] as const;

		arrows.forEach(({ name, label, icon, side, go }) => {
			ui.registerElement({
				name,
				order: 10,
				isButton: false,
				tagName: "button",
				html: icon,
				appendTo: "root",
				onInit: (el, pswp) => {
					el.setAttribute("type", "button");
					if (label) el.setAttribute("aria-label", label);
					el.className = `${sliderArrowClass} absolute top-1/2 ${side} z-10 -translate-y-1/2 max-md:top-auto max-md:bottom-5 max-md:translate-y-0`;
					el.addEventListener("click", () => pswp[go]());
				},
			});
		});
	});

	lightbox.init();
});
