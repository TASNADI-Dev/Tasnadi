# Project Guidelines & Architecture

## Project Goal

The main goal of this project is to migrate an existing Webflow site to Astro and EmDash. The original website is https://www.tasnadi.co/ — whenever a request is unclear or you don't understand what something refers to (a page, section, component, behavior or piece of content), check the original site and use it as the reference.

## Core Tech Stack

* **Framework:** Astro (`.astro` files)
* **Language:** TypeScript (Use standard TS types/interfaces in frontmatter)
* **Styling:** Tailwind CSS
* **CMS:** EmDash is the CMS for this project. Follow its build guide before setting up or changing anything CMS-related: https://emdashcms.com/start.md
* **Locale:** Hungarian (`hu`) is the default language; English (`en`) is the one translated language. All content and user-visible text is Hungarian by default, with an English translation as the secondary language.
* **English for Development:** Everything development-related must be in English, even though the site's main language is Hungarian. This includes class names, component names, file and folder names, variable and function names, props, routes/slugs in code, and any other identifiers. Only user-visible content is Hungarian (or its English translation).

## Design System & Styling Rules

* **Tailwind Configuration:** Define custom colors and fonts in `src/styles/global.css` via `@theme` (Tailwind v4). Do not add a `tailwind.config.mjs`.
* **Strict Color Usage:** Use only the theme colors defined in `src/styles/global.css`. Do **not** invent arbitrary hex codes or use default Tailwind colors (they are disabled via `--color-*: initial`).
  * Prefer the semantic colors over the base colors in components.
  * If a design or the original site uses a color that is not a variable, do not hardcode it — ask the user whether to add it as a new variable or use an existing color instead.
* **Typography:** Use only **Museo Sans** (`font-sans` / `font-heading`) for all text. The font files are in `public/global/fonts/`, loaded via `@font-face` and defined as theme fonts via `@theme` in `src/styles/global.css` (imported in `src/layouts/Base.astro`). Do not use other font families.
* **Units:** Do not use `px` for font sizes — use `rem` instead. When the user specifies a value in `px`, always convert it to `rem` first (16px = 1rem) before applying it in code. **Exception:** border radius values may use `px`.
* **Container:** The max width of the content should be 1230px.
* **Asset Storage:** For now, store all images and other assets in the `public/` folder. Every page gets its own folder (e.g. `public/home/`, `public/about/`) holding only the assets used on that page. Assets used on more than one page (e.g. favicon, logo) go in `public/global/`. Folder names are in English.

## Responsive & Mobile-First Design

* **Desktop-First Approach:** Write styles for desktop screens by default, then layer on layout and style changes using Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`).
* **Fluid Layouts:** Every component and page layout **must be responsive out of the box**. Do not build desktop-only layouts that overflow on smaller viewports.

## Component Architecture

* **File Structure:** Place all reusable `.astro` components in `src/components/`, page layouts in `src/layouts/`, and pages in `src/pages/`.
* **Islands Architecture:** Keep server-first rendering by default. Only use interactive client directives (`client:load`, `client:idle`, `client:visible`) when strictly necessary for JavaScript interactivity.
* **Components catalog:** Whenever you create or update a UI component (or add a variant), also add it to `src/pages/dev/components.astro`. Keep that page out of the main nav, group by component with every variant visible, and write the page itself in English.

## JavaScript Organization & Formatting

* **Modular Files:** Do **not** write monolithic `<script>` tags or massive single JS/TS files. Split logic into small, modular files organized logically in `src/scripts/` or alongside the component.
* **Header Comment Required:** Every JS/TS file **must** start with a brief 1–2 line comment explaining its core purpose. Don't add comments to other file types.

## Documentation

<!--
* **README tech stack:** Whenever you introduce a new tool, library, framework, host, or third-party service into the project (including new `package.json` dependencies and integrations wired in code), add it to the **Tech stack** list in `README.md` as `name — short use` (one brief phrase; no versions). Do not list transitive dependency packages.
-->
* Consult these official Astro guides before generating complex logic:
  - Routing: https://docs.astro.build/en/guides/routing/
  - Astro Components: https://docs.astro.build/en/basics/astro-components/
  - Content Collections: https://docs.astro.build/en/guides/content-collections/
  - Styling & Tailwind: https://docs.astro.build/en/guides/styling/