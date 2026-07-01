# AGENTS.md

## Project

This repository is a static personal resume homepage for Cao Xi. It is deployed with GitHub Pages:

- Site: https://caoxi0049-cloud.github.io/resume-homepage/
- Repository: https://github.com/caoxi0049-cloud/resume-homepage

The site is intentionally lightweight: plain HTML, CSS, and JavaScript. There is no build step, package manager, backend, or framework.

## File Map

- `index.html`: Page structure and semantic containers.
- `styles.css`: Visual design, responsive layout, assistant UI, and hero layout.
- `app.js`: Runtime rendering, language switching, contact panel, resume assistant interactions.
- `profile-data.js`: Primary editable content source for profile data, work experience, education, assistant prompts, and assistant answers.
- `assets/avatar.jpg`: About Me portrait.
- `assets/hero-photo.jpg`: Homepage hero portrait.
- `assets/resume.pdf`: Expected resume download file. This may be missing until the user provides a PDF.

## Local Workflow

Open `index.html` directly in a browser for a quick preview. For more accurate browser behavior, serve the folder with a local static server.

Use the installed Git tools:

```powershell
D:\Programs\Git\cmd\git.exe status
D:\Programs\Git\cmd\git.exe add .
D:\Programs\Git\cmd\git.exe commit -m "Update resume homepage"
D:\Programs\Git\cmd\git.exe push
```

GitHub CLI is installed at:

```powershell
D:\Programs\GitHubCLI\gh.exe
```

## Content Editing Rules

Treat `profile-data.js` as the source of truth for resume content. Prefer editing data there instead of hardcoding resume text in `index.html`.

Keep these content boundaries:

- Homepage uses `basics.heroAvatar`, currently `assets/hero-photo.jpg`.
- About Me uses `basics.avatar`, currently `assets/avatar.jpg`.
- Company strip should only show prior employers requested by the user, currently Dmall / Dmall-related `多点` and TAL `好未来`.
- Work experience should include only company-level entries unless the user explicitly asks to show project entries separately.
- Project details can still exist in the assistant knowledge base, but should not automatically appear in the Work Experience timeline.

When adding Chinese text, preserve UTF-8. If PowerShell displays mojibake, do not assume the file is corrupted; verify by browser behavior or a UTF-8-aware reader before rewriting large sections.

## Visual Direction

The current visual style is a clean black-and-white resume portfolio with a restrained editorial layout.

Maintain these choices unless the user asks otherwise:

- Minimal black, white, and gray palette.
- Large Chinese role title on the homepage.
- `PRODUCT MANAGER` as a smaller outlined wordmark below the main role title, not behind the portrait.
- Original-color portraits, no grayscale filter.
- Floating resume assistant in the lower-right corner.
- Mobile layout should avoid overlapping title, portrait, and assistant controls.

Avoid decorative gradients, busy backgrounds, or heavy animation.

## Resume Assistant

The current assistant is front-end only. It uses keyword matching against `profile-data.js -> assistant.answers`.

Important behavior:

- The assistant launcher is a message icon.
- A nudge bubble appears after 3 seconds if the assistant has not been opened in the current session.
- Opening the assistant dismisses the nudge for the current session via `sessionStorage`.

Do not put model API keys in this repository. It is public and hosted on GitHub Pages.

## RAG Upgrade Direction

For a safer staged RAG implementation, prefer this roadmap:

1. Add a static `knowledge-base.js` or `knowledge-base.json` with structured resume and project documents.
2. Improve front-end retrieval with section scoring and source snippets.
3. If true generative answers are required, add a backend layer such as Vercel Functions, Netlify Functions, or Cloudflare Workers.
4. Keep API keys only in backend environment variables.
5. The frontend should call the backend API, never a model provider directly.

Recommended knowledge document fields:

- `id`
- `title`
- `type` such as `work`, `project`, `education`, `skill`, `faq`
- `keywords`
- `summary`
- `details`
- `metrics`
- `source`

Assistant answers should be grounded in the knowledge base and avoid inventing unverified claims.

## Deployment

After committing changes, push to `main`. GitHub Pages deploys from:

- Branch: `main`
- Folder: `/`

Verify deployment:

```powershell
D:\Programs\GitHubCLI\gh.exe api repos/caoxi0049-cloud/resume-homepage/pages --jq "{url:.html_url,status:.status}"
```

Expected site URL:

```text
https://caoxi0049-cloud.github.io/resume-homepage/
```

If the browser still shows old assets, use `Ctrl + F5` to bypass cache.

## Safety Notes

This is a public resume site. Before publishing, check for:

- Personal phone and email are intentional.
- No private internal business details beyond what the user has approved.
- No API keys, tokens, local paths, or private files.
- `assets/resume.pdf` should be intentionally provided by the user before publishing.
