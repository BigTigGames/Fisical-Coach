# Fisical Coach WebGL Build

This repository hosts the Unity WebGL build for Fisical Coach, configured for automatic deployment on Netlify without needing Git LFS.

## How Large File Splitting & Auto-Merge Works

GitHub rejects files larger than 100MB. The Unity data file (`Build/Fisical Coach.data.gz`) is ~152 MB.

1. **Local Splitting (`split.js`)**:
   - Splits any build file > 50MB into smaller chunks (`.part1`, `.part2`, etc.).
   - `.gitignore` ignores the assembled `*.data.gz` file so only the small `.part*` files get committed to GitHub.

2. **Auto-Merge on Netlify (`merge.js` + `netlify.toml`)**:
   - When you push to GitHub, Netlify automatically triggers a build.
   - Netlify executes `node merge.js` as specified in `[build] command` inside `netlify.toml`.
   - All `.part*` files are merged back into `Build/Fisical Coach.data.gz`.
   - `netlify.toml` configures required headers (`Content-Encoding: gzip`, `Content-Type`) for WebGL files.

## Workflow For Future Unity Builds

Whenever you export a new build from Unity into this directory:

### Option 1 (Recommended - 1-Click):
Double-click `post-build.bat` (or run `npm run postbuild`).
It will:
1. Detect the active build from `index.html`.
2. Clean up any obsolete/stale chunks.
3. Split the `.data.gz` file into GitHub-friendly chunks under 50MB.
4. Prompt you to commit and push straight to GitHub (Netlify automatically deploys!).

### Option 2 (Manual):
1. Run split:
   ```bash
   node split.js
   ```
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update WebGL build"
   git push origin main
   ```

Netlify will automatically merge the files during deploy!

