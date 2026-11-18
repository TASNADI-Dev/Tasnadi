// Turns an <img> into a static CMYK halftone print with Paper's shader, loaded only once it nears the viewport.
// The plain <img> stays underneath as the fallback (no JS, no WebGL) and keeps the alt text.

// Ink and paper colors come from CSS variables set on the wrapper, so they stay theme colors
const readColor = (style: CSSStyleDeclaration, name: string) => style.getPropertyValue(name).trim();

async function mountHalftone(wrapper: HTMLElement, img: HTMLImageElement, target: HTMLElement) {
	img.loading = "eager";
	if (!img.complete) await new Promise((resolve) => img.addEventListener("load", resolve, { once: true }));

	const { ShaderMount, halftoneCmykFragmentShader, getShaderColorFromString, getShaderNoiseTexture, ShaderFitOptions, HalftoneCmykTypes } =
		await import("@paper-design/shaders");
	const style = getComputedStyle(wrapper);
	const noise = getShaderNoiseTexture();
	if (noise && !noise.complete) await new Promise((resolve) => noise.addEventListener("load", resolve, { once: true }));

	new ShaderMount(
		target,
		halftoneCmykFragmentShader,
		{
			u_image: img,
			u_noiseTexture: noise,
			u_colorBack: getShaderColorFromString(readColor(style, "--halftone-back")),
			u_colorC: getShaderColorFromString(readColor(style, "--halftone-c")),
			u_colorM: getShaderColorFromString(readColor(style, "--halftone-m")),
			u_colorY: getShaderColorFromString(readColor(style, "--halftone-y")),
			u_colorK: getShaderColorFromString(readColor(style, "--halftone-k")),
			u_size: 0.2,
			u_contrast: 1,
			u_softness: 1,
			u_grainSize: 0.5,
			u_grainMixer: 0,
			u_grainOverlay: 0,
			u_gridNoise: 0.2,
			u_floodC: 0.05,
			u_floodM: 0.1,
			u_floodY: 0.18,
			u_floodK: 0,
			u_gainC: 0.2,
			u_gainM: 0.3,
			u_gainY: 0.4,
			u_gainK: 0,
			u_type: HalftoneCmykTypes.ink,
			u_fit: ShaderFitOptions.cover,
			u_scale: 1,
			u_rotation: 0,
			u_originX: 0.5,
			u_originY: 0.5,
			u_offsetX: 0,
			u_offsetY: 0,
			u_worldWidth: 0,
			u_worldHeight: 0,
		},
		undefined,
		0,
	);
	target.dataset.ready = "";
}

export function initHalftoneImages() {
	document.querySelectorAll<HTMLElement>("[data-halftone]").forEach((wrapper) => {
		const img = wrapper.querySelector<HTMLImageElement>("img");
		const target = wrapper.querySelector<HTMLElement>("[data-halftone-target]");
		if (!img || !target) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				mountHalftone(wrapper, img, target).catch((error) => {
					console.error(error);
					target.remove();
				});
			},
			{ rootMargin: "200px" },
		);
		observer.observe(wrapper);
	});
}
