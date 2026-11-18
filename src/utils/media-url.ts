// Builds the URL of the original (full size) file of a CMS image, used where a link must open the image itself.
type CmsImage = { id: string; meta?: Record<string, unknown> };

export function mediaFileUrl(image: CmsImage) {
	const storageKey = image.meta?.storageKey;
	return `/_emdash/api/media/file/${typeof storageKey === "string" && storageKey ? storageKey : image.id}`;
}
