# Fisical Coach WebGL Build

This repository hosts the Unity WebGL build for Fisical Coach, configured for automatic dual deployment on **Netlify** and **Vercel** without needing Git LFS.

## Why Did Netlify Pause?
Netlify's Free tier has a **100 GB/month bandwidth limit**. Because the Unity data files (`Build/*.data.gz`) are ~380 MB, ~250 page visits/refreshes reach 100 GB and trigger an automatic pause on Netlify. 
Adding **Vercel** gives you an additional 100 GB/month limit, and HTTP caching headers have been added so repeat visitors load from their local browser cache instead of redownloading 380 MB every time!

## How Large File Splitting & Auto-Merge Works

GitHub rejects files larger than 100MB. The Unity data file is ~380 MB.

1. **Local Splitting (`split.js`)**:
   - Splits any build file > 50MB into smaller chunks (`.part1`, `.part2`, etc.).
   - `.gitignore` ignores the assembled `*.data.gz` file so only the small `.part*` files get committed to GitHub.

2. **Auto-Merge on Deployment (`merge.js` + `netlify.toml` + `vercel.json`)**:
   - When you push to GitHub, **both Netlify and Vercel** automatically trigger a build.
   - Both execute `node merge.js` before serving.
   - All `.part*` files are merged back into `Build/*.data.gz`.
   - Headers (`Content-Encoding: gzip`, `Content-Type`, `Cache-Control`) are configured for WebGL in both `netlify.toml` and `vercel.json`.

---

## 1-Time Setup: Connecting to Vercel

1. Log in to [Vercel](https://vercel.com) using your GitHub account.
2. Click **"Add New..."** > **"Project"**.
3. Import your **`Fisical-Coach`** GitHub repository.
4. Vercel automatically detects `vercel.json` and configures:
   - **Framework Preset**: Other
   - **Build Command**: `node merge.js`
   - **Output Directory**: `.`
5. Click **"Deploy"**.
6. That's it! Every future `git push` will deploy to **both Netlify and Vercel** automatically.

---

## Workflow For Future Unity Builds

Whenever you export a new build from Unity into this directory:

### Option 1 (Recommended - 1-Click):
Double-click `post-build.bat` (or run `npm run postbuild`).
It will:
1. Detect the active build from `index.html`.
2. Clean up any obsolete/stale chunks.
3. Split the `.data.gz` file into GitHub-friendly chunks under 50MB.
4. Commit and push straight to GitHub (Netlify and Vercel will both auto-deploy!).

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

Both Netlify and Vercel will automatically merge the files during deploy!


