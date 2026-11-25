// Scroll-driven planet Lottie of the Method page approach section: plays the animation and highlights the matching aspect,
// following the timeline of the original Webflow interaction (desktop and mobile each have their own file and timeline).
import type { AnimationItem } from "lottie-web";

// [scroll progress in %, value] keyframes, interpolated linearly and held before the first and after the last one
type Track = [number, number][];

type Timeline = {
	// Lottie position in % of its frames
	frames: Track;
	opacity: Track;
	// Vertical offset of the Lottie in rem
	shift?: Track;
	// Opacity of each aspect item, in order
	items: Track[];
};

// Each aspect lights up while its planet layer glows in the Lottie (frames 242, 272, 302, 332 and 362 on desktop)
const DESKTOP: Timeline = {
	frames: [
		[20, 0],
		[32, 11],
		[56, 54],
		[57, 55],
		[90, 86],
	],
	opacity: [
		[16, 0],
		[18, 1],
		[85, 1],
		[90, 0],
	],
	shift: [
		[0, 50],
		[18, 0],
	],
	items: [
		[50, 52, 56, 58],
		[58, 59, 64, 66],
		[66, 68, 72, 74],
		[73, 75, 79, 81],
		[81, 83, 87, 89],
	].map(([a, b, c, d]) => [
		[a, 0.4],
		[b, 1],
		[c, 1],
		[d, 0.4],
	]),
};

// On mobile the planet stays on top and each aspect fades out as it scrolls up to it
const MOBILE: Timeline = {
	frames: [
		[0, 0],
		[38, 38],
		[72, 66],
		[100, 99],
	],
	opacity: [
		[76, 1],
		[85, 0],
	],
	items: [26, 38, 51, 63, 74].map((start) => [
		[start, 1],
		[start + 2, 0],
	]),
};

// Time constant (ms) of the easing that makes the animation trail the scroll smoothly
const EASE_TIME = 150;

function sample(track: Track, progress: number) {
	if (progress <= track[0][0]) return track[0][1];
	for (let i = 1; i < track.length; i++) {
		const [p1, v1] = track[i];
		if (progress <= p1) {
			const [p0, v0] = track[i - 1];
			return v0 + ((v1 - v0) * (progress - p0)) / (p1 - p0);
		}
	}
	return track[track.length - 1][1];
}

function initSection(section: HTMLElement) {
	const player = section.querySelector<HTMLElement>("[data-planet-player]");
	const aspects = section.querySelector<HTMLElement>("[data-planet-aspects]");
	const items = [...section.querySelectorAll<HTMLElement>("[data-planet-item]")];
	if (!player || !aspects) return;

	const desktop = window.matchMedia("(min-width: 64rem)");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let animation: AnimationItem | null = null;
	let loadId = 0;
	let loaded = false;
	let progress = 0;
	let target = 0;
	let last = 0;
	let frame = 0;

	// Desktop: 0 when the section top enters the screen (plus 5% of its height), 100 when its bottom leaves the top.
	// Mobile: the same over the aspects part, without the offset.
	const readTarget = () => {
		const screen = window.innerHeight;
		const { top, height } = (desktop.matches ? section : aspects).getBoundingClientRect();
		const offset = desktop.matches ? height * 0.05 : 0;
		const value = ((screen - offset - top) / (height + screen - offset)) * 100;
		return Math.min(Math.max(value, 0), 100);
	};

	const render = () => {
		const timeline = desktop.matches ? DESKTOP : MOBILE;
		const opacity = sample(timeline.opacity, progress);
		player.style.opacity = String(opacity);
		player.style.visibility = opacity > 0 ? "" : "hidden";
		player.style.transform = timeline.shift ? `translate3d(0, ${sample(timeline.shift, progress)}rem, 0)` : "";
		items.forEach((item, index) => {
			item.style.opacity = String(sample(timeline.items[index] ?? [[0, 1]], progress));
		});
		if (animation && opacity > 0) {
			const position = (sample(timeline.frames, progress) / 100) * animation.totalFrames;
			animation.goToAndStop(Math.min(position, animation.totalFrames - 1), true);
		}
	};

	const load = async () => {
		const id = ++loadId;
		animation?.destroy();
		animation = null;
		const { default: lottie } = await import("lottie-web/build/player/lottie_light");
		if (id !== loadId) return;
		animation = lottie.loadAnimation({
			container: player,
			renderer: "svg",
			loop: false,
			autoplay: false,
			path: desktop.matches ? player.dataset.srcDesktop : player.dataset.srcMobile,
		});
		animation.addEventListener("DOMLoaded", render);
	};

	const tick = (now: number) => {
		const dt = Math.min(now - last, 64);
		last = now;
		// Exponential easing, independent of the frame rate
		progress += (target - progress) * (1 - Math.exp(-dt / EASE_TIME));
		if (Math.abs(target - progress) < 0.01) progress = target;
		render();
		frame = progress === target ? 0 : requestAnimationFrame(tick);
	};

	const update = () => {
		target = readTarget();
		if (reducedMotion) {
			progress = target;
			render();
			return;
		}
		if (!frame) {
			last = performance.now();
			frame = requestAnimationFrame(tick);
		}
	};

	// Load the player and the animation file only when the section gets close to the screen
	new IntersectionObserver(
		(entries, observer) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer.disconnect();
			loaded = true;
			load();
		},
		{ rootMargin: "100% 0px" },
	).observe(section);

	desktop.addEventListener("change", () => {
		if (loaded) load();
		update();
	});
	window.addEventListener("scroll", update, { passive: true });
	window.addEventListener("resize", update);
	progress = target = readTarget();
	render();
}

export function initApproachPlanet() {
	document.querySelectorAll<HTMLElement>("[data-approach-planet]").forEach(initSection);
}
