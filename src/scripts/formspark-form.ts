// Submits Formspark forms via fetch and toggles their loader, success and error states.
type TurnstileApi = { reset: () => void };

export function initFormsparkForms() {
	document
		.querySelectorAll<HTMLFormElement>('form[action^="https://submit-form.com"]')
		.forEach((form) => {
			// A page can load this from several components, so every form is wired only once
			if (form.dataset.formsparkReady) return;
			form.dataset.formsparkReady = "true";

			const root = form.parentElement;
			const success = root?.querySelector<HTMLElement>("[data-form-success]");
			const failure = root?.querySelector<HTMLElement>("[data-form-error]");
			const loader = form.querySelector<HTMLElement>("[data-form-loader]");
			const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');

			form.addEventListener("submit", async (event) => {
				event.preventDefault();
				failure?.classList.add("hidden");
				loader?.classList.remove("hidden");
				if (submit) submit.disabled = true;

				try {
					const response = await fetch(form.action, {
						method: "POST",
						headers: { Accept: "application/json" },
						body: new URLSearchParams(new FormData(form) as unknown as Record<string, string>),
					});
					if (!response.ok) throw new Error(`Formspark responded with ${response.status}`);

					form.classList.add("hidden");
					success?.classList.remove("hidden");
					success?.focus();
				} catch {
					failure?.classList.remove("hidden");
					// A Turnstile token can only be used once, so request a fresh one for the retry
					(window as unknown as { turnstile?: TurnstileApi }).turnstile?.reset();
				} finally {
					loader?.classList.add("hidden");
					if (submit) submit.disabled = false;
				}
			});
		});
}
