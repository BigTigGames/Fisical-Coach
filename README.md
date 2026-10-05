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

1. Run the split script:
   ```bash
   node split.js
   ```
   *(or `npm run split`)*

2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update WebGL build"
   git push origin main
   ```

3. Netlify will automatically merge the files during deploy!
