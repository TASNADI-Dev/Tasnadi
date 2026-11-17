// Slides the About values astronaut left as the page scrolls down and right as it scrolls up, eased and kept inside the screen.
// Time constant (ms) of the easing: higher means the astronaut trails the scroll more lazily
const EASE_TIME = 220;

export function initAboutAstronaut() {
	const section = document.querySelector<HTMLElement>("[data-about-values]");
	const astronaut = section?.querySelector<HTMLElement>("[data-about-astronaut]");
	if (!section || !astronaut) return;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	let progress = 0;
	let target = 0;
	let last = 0;
	let frame = 0;

	// How far the astronaut can slide from its resting spot at the right edge before reaching the same gap at the left edge
	const travel = () => {
		const gap = parseFloat(getComputedStyle(astronaut).right) || 0;
		return Math.max(section.clientWidth - astronaut.offsetWidth - gap * 2, 0);
	};

	const readTarget = () => {
		const { top } = section.getBoundingClientRect();
		const height = window.innerHeight;
		// 0 while the astronaut is just entering at the bottom of the screen, 1 as it leaves at the top
		return Math.min(Math.max((height - top) / (height + astronaut.offsetHeight), 0), 1);
	};

	const render = () => {
		astronaut.style.transform = `translate3d(${-progress * travel()}px, 0, 0)`;
	};

	const tick = (now: number) => {
		const dt = Math.min(now - last, 64);
		last = now;
		// Exponential easing, independent of the frame rate
		progress += (target - progress) * (1 - Math.exp(-dt / EASE_TIME));
		if (Math.abs(target - progress) < 0.0005) progress = target;
		render();
		frame = progress === target ? 0 : requestAnimationFrame(tick);
	};

	const update = () => {
		target = readTarget();
		if (!frame) {
			last = performance.now();
			frame = requestAnimationFrame(tick);
		}
	};

	window.addEventListener("scroll", update, { passive: true });
	window.addEventListener("resize", update);
	progress = target = readTarget();
	render();
}
