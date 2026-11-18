// Slides each About page astronaut across its section as the page scrolls, eased and kept inside the screen.
// Time constant (ms) of the easing: higher means the astronaut trails the scroll more lazily
const EASE_TIME = 220;

// `data-direction="left"` (default) rests at the right edge and slides left on scroll down; "right" does the opposite
function initAstronaut(astronaut: HTMLElement) {
	const section = astronaut.closest<HTMLElement>("section");
	if (!section) return;
	const sign = astronaut.dataset.direction === "right" ? 1 : -1;

	let progress = 0;
	let target = 0;
	let last = 0;
	let frame = 0;

	// How far the astronaut can slide from its resting spot at one edge before reaching the same gap at the opposite edge
	const travel = () => {
		const style = getComputedStyle(astronaut);
		const gap = parseFloat(sign === 1 ? style.left : style.right) || 0;
		return Math.max(section.clientWidth - astronaut.offsetWidth - gap * 2, 0);
	};

	const readTarget = () => {
		const { top } = section.getBoundingClientRect();
		const height = window.innerHeight;
		// 0 while the astronaut is just entering at the bottom of the screen, 1 as it leaves at the top
		return Math.min(Math.max((height - top) / (height + astronaut.offsetHeight), 0), 1);
	};

	const render = () => {
		astronaut.style.transform = `translate3d(${sign * progress * travel()}px, 0, 0)`;
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

export function initAboutAstronaut() {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	document.querySelectorAll<HTMLElement>("[data-about-astronaut]").forEach(initAstronaut);
}
