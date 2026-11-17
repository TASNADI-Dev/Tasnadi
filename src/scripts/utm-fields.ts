// Copies utm_* URL parameters into matching hidden form fields and remembers them for the session.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

export function initUtmFields() {
	const params = new URLSearchParams(window.location.search);

	UTM_KEYS.forEach((key) => {
		let value = params.get(key);
		try {
			if (value) sessionStorage.setItem(key, value);
			else value = sessionStorage.getItem(key);
		} catch {
			// Storage can be blocked; the URL value still works for this page view
		}
		if (!value) return;

		document
			.querySelectorAll<HTMLInputElement>(`input[name="${key}"]`)
			.forEach((input) => (input.value = value));
	});
}
