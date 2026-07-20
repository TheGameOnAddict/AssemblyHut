# Mobile CAD v0.3

A GitHub Pages-compatible Three.js prototype.

## Included

- Cube loaded at startup
- Cube, cylinder, cone and sphere creation
- Safe model-only selection
- Move, rotate and scale tools
- Duplicate and delete
- Orbit, pan and zoom
- Mobile-first interface
- Basic installable PWA shell
- Service worker for local application files

## GitHub Pages

1. Extract this ZIP.
2. Upload the files and folders to the root of your GitHub repository.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.

After GitHub deploys the update, open the Pages URL. If an older version is cached, open the URL with `?v=3` once or clear the site's browser data.

## Internet requirement

Three.js and its controls are loaded from the unpkg CDN, so the first load requires internet access. The app shell is cached, but complete offline Three.js support will require bundling those dependencies locally.
