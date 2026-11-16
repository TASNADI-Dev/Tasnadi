# TASNADI website

Migration of the Webflow site at https://www.tasnadi.co/ to Astro and EmDash.

- **Stack:** Astro, TypeScript, Tailwind CSS v4, EmDash CMS (SQLite, local uploads)
- **Locales:** Hungarian (default, unprefixed) and English (`/en`)
- **Project rules:** see [AGENTS.md](AGENTS.md)

## Commands

| Command             | Action                                      |
| :------------------ | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Start the dev server at `localhost:4321`    |
| `npm run build`     | Build the production site to `./dist/`      |
| `npm run preview`   | Preview the production build locally        |
| `npm run typecheck` | Run `astro check`                           |

The EmDash admin is at `/_emdash/admin`. Content types and starting data live in `seed/seed.json`; the seed only applies to a fresh database.

The internal component and color reference is at `/dev/style-guide`.
