// Drives the About hero: rotates the title word on a timer, fades the arrow on scroll and moves the 3D text crawl.
const ROTATE_INTERVAL = 2000;
// How far the crawl travels along its tilted plane (px) for each px of scroll
const CRAWL_SPEED = 0.7;
// Matches rotateX(45deg) on the crawl
const TILT = Math.PI / 4;
// Where the crawl's bottom edge comes to rest, as a share of the title bar (inside its black gradient, just below the title)
const REST_LINE = 0.7;
// Gap between the crawl's resting bottom edge and the end of the section (rem)
const END_GAP = 8;
// Share of the crawl, at its end, over which the text fades to opacity 0
const FADE_OUT = 0.2;

export function initAboutHero() {
	const hero = document.querySelector<HTMLElement>("[data-about-hero]");
	const track = hero?.querySelector<HTMLElement>("[data-crawl-track]");
	const crawl = hero?.querySelector<HTMLElement>("[data-about-crawl]");
	const titleBar = hero?.querySelector<HTMLElement>("[data-title-bar]");
	const ending = hero?.querySelector<HTMLElement>("[data-crawl-end]");
	const stage = crawl?.parentElement;
	if (!hero || !track || !crawl || !titleBar || !ending || !stage) return;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	const words = hero.querySelectorAll<HTMLElement>("[data-title-word]");
	let travel = { start: 0, end: 0, range: 1 };
	let frame = 0;

	// Inverse perspective projection: the offset along the tilted plane that lands `screen` px from the perspective origin
	const unproject = (screen: number, perspective: number) => {
		const clamped = Math.max(screen, -0.9 * perspective);
		return (clamped * perspective) / (Math.cos(TILT) * perspective + clamped * Math.sin(TILT));
	};

	// The crawl starts with its top edge just below the fold and comes to rest just below the title.
	// The pinned view is released exactly then, with the section's curved end already END_GAP below the text.
	const measure = () => {
		const viewport = window.innerHeight;
		const half = crawl.offsetHeight / 2;
		const perspective = parseFloat(getComputedStyle(stage).perspective) || 800;
		const restTop = track.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(track).paddingTop);
		const restBottom = titleBar.offsetHeight * REST_LINE;
		const gap = END_GAP * parseFloat(getComputedStyle(document.documentElement).fontSize);

		const start = unproject(viewport + 16 - (restTop + half), perspective) + half;
		const end = unproject(restBottom - half, perspective) - half;
		const range = Math.max((start - end) / CRAWL_SPEED, 1);
		travel = { start, end, range };
		track.style.height = `${viewport + range}px`;
		ending.style.marginTop = `${restBottom + gap - viewport}px`;
	};

	const update = () => {
		frame = 0;
		const progress = Math.min(Math.max(-track.getBoundingClientRect().top / travel.range, 0), 1);
		crawl.style.setProperty("--crawl-y", `${travel.start + (travel.end - travel.start) * progress}px`);
		crawl.style.opacity = String(Math.min(1, (1 - progress) / FADE_OUT));
		hero.dataset.scrolled = String(window.scrollY > 8);
	};

	const requestUpdate = () => {
		if (!frame) frame = requestAnimationFrame(update);
	};

	const remeasure = () => {
		measure();
		update();
	};

	// Words always travel top to bottom: the current one drops out, the next one drops in from above
	const slide = (word: HTMLElement, from: string, to: string) =>
		word.animate([{ translate: from }, { translate: to }], { duration: 500, easing: "ease-out" });

	setInterval(() => {
		const state = hero.dataset.title === "main" ? "alt" : "main";
		hero.dataset.title = state;
		words.forEach((word) => {
			const entering = word.dataset.titleWord === state;
			word.setAttribute("aria-hidden", String(!entering));
			if (entering) slide(word, "0 -100%", "0 0");
			else slide(word, "0 0", "0 100%");
		});
	}, ROTATE_INTERVAL);

	window.addEventListener("scroll", requestUpdate, { passive: true });
	window.addEventListener("resize", remeasure);
	new ResizeObserver(remeasure).observe(crawl);
	remeasure();
}
