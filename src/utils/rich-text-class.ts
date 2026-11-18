// Tailwind classes that style the rich text coming from the CMS (blog posts, podcast episodes), which cannot carry classes of its own.
export const richTextClass = [
	"text-base leading-[1.75rem] font-light text-text-muted",
	"[--emdash-caption-color:var(--color-text-muted)]",
	"[&>:first-child]:mt-0",
	"[&_p]:my-5",
	"[&_strong]:font-bold [&_strong]:text-text [&_a_strong]:text-inherit",
	"[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:duration-200 [&_a:hover]:text-primary motion-reduce:[&_a]:transition-none",
	"[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-[1.75rem] [&_h2]:leading-9 [&_h2]:font-medium [&_h2]:text-text max-lg:[&_h2]:text-2xl max-lg:[&_h2]:leading-8",
	"[&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:text-[1.375rem] [&_h3]:leading-8 [&_h3]:font-medium [&_h3]:text-text max-lg:[&_h3]:text-xl max-lg:[&_h3]:leading-7",
	"[&_h4]:mt-8 [&_h4]:mb-3 [&_h4]:text-lg [&_h4]:leading-7 [&_h4]:font-medium [&_h4]:text-text",
	"[&_h5]:mt-8 [&_h5]:mb-3 [&_h5]:text-base [&_h5]:font-medium [&_h5]:text-text",
	"[&_h6]:mt-8 [&_h6]:mb-3 [&_h6]:text-base [&_h6]:font-medium [&_h6]:text-text",
	"[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6",
	"[&_li]:my-2 [&_li]:pl-1 [&_li_ul]:my-2 [&_li_ol]:my-2 [&_li::marker]:text-text",
	"[&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-6 [&_blockquote]:text-lg [&_blockquote]:leading-8 [&_blockquote]:font-medium [&_blockquote]:text-text",
	"[&_img]:rounded-[20px]",
];
