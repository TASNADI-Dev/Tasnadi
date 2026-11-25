# Project Guidelines & Architecture

## Project Goal

The main goal of this project is to migrate an existing Webflow site to Astro and EmDash. The original website is https://www.tasnadi.co/ — whenever a request is unclear or you don't understand what something refers to (a page, section, component, behavior or piece of content), check the original site and use it as the reference.

## Core Tech Stack

* **Framework:** Astro (`.astro` files)
* **Language:** TypeScript (Use standard TS types/interfaces in frontmatter)
* **Styling:** Tailwind CSS
* **CMS:** EmDash is the CMS for this project. Follow its build guide before setting up or changing anything CMS-related: https://emdashcms.com/start.md
* **Locale:** Hungarian (`hu`) is the default language; English (`en`) is the one translated language. All content and user-visible text is Hungarian by default, with an English translation as the secondary language.
* **Locale Routing:** Astro i18n is configured in `astro.config.mjs` (EmDash reads the same config). Hungarian is served unprefixed, English under `/en`. Pages are **not** duplicated per locale: a missing `/en/...` page falls back to the Hungarian one via rewrite, and components read the language from `Astro.currentLocale` (never from `Astro.url`, which holds the internal path after a rewrite). Only the home page has an explicit `src/pages/en/index.astro`, because the `[slug]` route would otherwise swallow `/en`.
* **Localized URLs:** Every language has its own public slugs, set in one route map, `src/i18n/routes.ts`:
  * File names and internal paths stay English. A page's internal path (its file under `src/pages`) is also its English URL after `/en` (`/about` → `/en/about`), kept identical to the original tasnadi.co URLs.
  * The Hungarian URL comes from the map (`/about` → `/rolunk`): lowercase ASCII without accents, words joined by hyphens. Pages missing from the map keep the same slug in both languages (e.g. `/blog`, `/podcast`).
  * `src/middleware.ts` serves Hungarian slugs from the internal page and 301-redirects old URLs (`/about` → `/en/about`, `/hu/about` → `/rolunk`) and slugs in the wrong language.
  * Build every internal link with `localizePath(internalPath, locale)`. Never hardcode a public path or an `/en` prefix.
  * **Every new page must be added to the map with both languages** (skip it only if the slug is the same in both).
  * Canonical, hreflang (`x-default` is English, as on the original site), the language switcher and the sitemap are generated from the map. CMS entries pass their per-language URLs to `Base` via `getEntryAlternates`.
* **English for Development:** Everything development-related must be in English, even though the site's main language is Hungarian. This includes class names, component names, file and folder names, variable and function names, props, routes and internal paths in code, and any other identifiers. Public Hungarian URL slugs are the exception (see Localized URLs). Only user-visible content is Hungarian (or its English translation).
* **Dashes in Hungarian:** There are three dash lengths: the hyphen `-` (short), the en dash `–` (medium) and the em dash `—` (long). In Hungarian text we never use the em dash `—`; only the hyphen `-` and the en dash `–`. Wherever the em dash appears in user-visible content (including page titles), replace it with the en dash `–`.

## Page Titles (Meta Title)

* **Pattern:** Every page's browser tab title (`<title>`) is `Page name | TASNADI`: the page name, then a space, a vertical bar `|`, a space, and `TASNADI` in capital letters without accents (copied from the original site, e.g. `Podcast | TASNADI`, `Rólunk | TASNADI`, `Webdizájn és branding ügynökség | TASNADI`).
* **Implementation:** `src/layouts/Base.astro` appends ` | TASNADI` (the site title from the site settings) automatically, so a page passes only the page name as `title` (e.g. `<Base title={copy.pageTitle}>`) and never adds the suffix, the brand name or any other separator itself. Pages whose title comes from EmDash (`getSeoMeta`) already get the same pattern.
* **Every New Page:** Follow this pattern for every new page, in both languages (the page name follows the active locale). The home page uses the descriptive title, not just the brand name.
* **Dashes:** The page name follows the dash rule above (no em dash `—`).

## Design System & Styling Rules

* **Tailwind Configuration:** Define custom colors and fonts in `src/styles/global.css` via `@theme` (Tailwind v4). Do not add a `tailwind.config.mjs`.
* **Strict Color Usage:** Use only the theme colors defined in `src/styles/global.css`. Do **not** invent arbitrary hex codes or use default Tailwind colors (they are disabled via `--color-*: initial`).
  * **Semantic colors only:** Elements, components, sections and pages must never use base color variables (e.g. `bg-gray-900`, `text-white`, `border-gray-300`, `var(--color-orange-700)`). Always use a semantic color (e.g. `bg-surface-dark`, `text-text-inverse`, `border-border-strong`, `var(--color-primary-active)`), including inside arbitrary values and `color-mix()` (shadows use `var(--color-shadow)`). Base colors exist only as the palette that semantic colors are mapped to in `src/styles/global.css`, and as the swatches in the Base colors group of the style guide.
  * If no semantic color fits the purpose, add a new semantic color mapped to the right base color (name it by purpose, not by appearance) instead of using the base color directly.
  * If a design or the original site uses a color that is not a variable, do not hardcode it — ask the user whether to add it as a new variable or use an existing color instead.
  * Whenever you add, change or remove a color variable (base or semantic) in `src/styles/global.css`, update the Colors section of `src/pages/dev/style-guide.astro` in the same change.
* **Typography:** Use only **Museo Sans** (`font-sans` / `font-heading`) for all text. The font files are in `public/global/fonts/`, loaded via `@font-face` and defined as theme fonts via `@theme` in `src/styles/global.css` (imported in `src/layouts/Base.astro`). Do not use other font families.
* **Units:** Do not use `px` for font sizes — use `rem` instead. When the user specifies a value in `px`, always convert it to `rem` first (16px = 1rem) before applying it in code. **Exception:** border radius values may use `px`.
* **Container:** The max width of the content should be 1230px.
* **Asset Storage:** For now, store all images and other assets in the `public/` folder. Every page gets its own folder (e.g. `public/home/`, `public/about/`) holding only the assets used on that page. Assets used on more than one page (e.g. favicon, logo) go in `public/global/`. Folder names are in English.

## Images & Alt Text

* **Always Add Alt Text In Both Languages:** Every time a new image is added, write a short, descriptive alt text in both Hungarian (`hu`) and English (`en`). This applies to static images and to images managed in EmDash.
* **Static Images:** Alt text is user-visible content, so it follows the active locale (read it from `Astro.currentLocale`), never a single hardcoded language. Keep the Hungarian and English strings together where the image is used.
* **CMS Images (EmDash):** Fill in the `alt` of every image field and Portable Text image block in both the Hungarian entry and its English translation. Also set the alt text on the Media Library item, and include `alt` in `$media` references in `seed/seed.json`, so the value is never empty. Each locale entry stores its own alt, so the English entry must not reuse the Hungarian text. Components must render the CMS alt: pass no `alt` prop to EmDash's `<Image>` (it uses `image.alt` by default) and never hardcode `alt=""` or a field like the title on a CMS image. Only add an `alt` override for decorative CMS images (e.g. a hover duplicate of another image) or as a fallback when the CMS alt is empty.
* **Writing Alt Text:** Keep it short (a brief phrase, not a sentence-long essay), describe what the image shows or its purpose, and don't start with "image of" or "picture of". Don't use a file name as alt text.
* **Decorative Images:** Purely decorative images (background shapes, ornaments, repeated icons next to text that already says the same thing) keep an empty `alt=""` and need no translation. Say so when you add one.
* **Linked Images And Icons:** If an image is the only content of a link or button, its alt text describes the destination or action.

## Responsive & Mobile-First Design

* **Desktop-First Approach:** Write styles for desktop screens by default, then layer on layout and style changes using Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`).
* **Fluid Layouts:** Every component and page layout **must be responsive out of the box**. Do not build desktop-only layouts that overflow on smaller viewports.

## Component Architecture

* **File Structure:** Place all reusable `.astro` components in `src/components/`, page layouts in `src/layouts/`, and pages in `src/pages/`.
* **Islands Architecture:** Keep server-first rendering by default. Only use interactive client directives (`client:load`, `client:idle`, `client:visible`) when strictly necessary for JavaScript interactivity.
* **Style guide:** `src/pages/dev/style-guide.astro` is the internal reference for colors and reusable UI components. Whenever you create or update a UI component (or add a variant), also add it to this page. Keep it out of the main nav, group by component with every variant visible, and write the page itself in English. Do not add descriptions under a component's heading; show only the component and its variants. The only exception is a short help note about behavior the preview cannot show (e.g. a component that renders in Hungarian only).

## JavaScript Organization & Formatting

* **Component Scripts Stay Inline:** JavaScript that belongs to a single component goes in a `<script>` tag inside that component's `.astro` file (Astro bundles and dedupes it automatically). Keep these scripts short and focused on one job.
* **Extract When It Grows:** Move logic into small, modular files in `src/scripts/` and import them (e.g. `import "../scripts/menu-toggle";`) when the script is shared by more than one component, or when it grows past roughly 30–40 lines or starts doing more than one job. Do **not** write monolithic `<script>` tags or massive single JS/TS files.
* **Header Comment Required:** Every JS/TS file, and every inline component `<script>`, **must** start with a brief 1–2 line comment explaining its core purpose. Don't add comments to other file types or to the rest of an `.astro` file.

## Animations

* **CSS First:** Do animations with CSS (transitions, keyframes, Tailwind utilities) whenever it is enough.
* **GSAP When CSS Is Not Enough:** Use GSAP only for animations CSS can't handle well (e.g. scroll-driven or timeline-based sequences, complex choreography). Do not use any other animation library.
* **Vanilla JS For Simple State Changes:** Simple interactions like toggling, showing and hiding are done with plain vanilla JavaScript (usually toggling a class or `data-` attribute that CSS animates), with no need for GSAP.
* **Respect Reduced Motion:** Honor `prefers-reduced-motion` (e.g. Tailwind's `motion-reduce:` variant) for non-essential animations.

## Documentation

<!--
* **README tech stack:** Whenever you introduce a new tool, library, framework, host, or third-party service into the project (including new `package.json` dependencies and integrations wired in code), add it to the **Tech stack** list in `README.md` as `name — short use` (one brief phrase; no versions). Do not list transitive dependency packages.
-->
* Consult these official Astro guides before generating complex logic:
  - Routing: https://docs.astro.build/en/guides/routing/
  - Astro Components: https://docs.astro.build/en/basics/astro-components/
  - Content Collections: https://docs.astro.build/en/guides/content-collections/
  - Styling & Tailwind: https://docs.astro.build/en/guides/styling/

## Git

* **Branches:** Never create a new branch unless the user specifically asks for one. By default, commit directly on the current branch (usually `main`) and push it there.