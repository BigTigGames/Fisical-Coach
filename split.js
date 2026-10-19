const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'Build');
const INDEX_HTML = path.join(__dirname, 'index.html');
const CHUNK_SIZE_MB = 50; // 50MB per chunk, well below GitHub 100MB limit
const CHUNK_SIZE = CHUNK_SIZE_MB * 1024 * 1024;

/**
 * Parses index.html to find active build files currently referenced.
 * Returns a Set of active filenames (e.g. ['Fisical Coach.data.gz', ...]), or null if not found.
 */
function getActiveBuildFiles() {
  if (!fs.existsSync(INDEX_HTML)) {
    return null;
  }

  const content = fs.readFileSync(INDEX_HTML, 'utf8');
  const activeFiles = new Set();
  const urlMatches = content.matchAll(
    /(?:dataUrl|frameworkUrl|codeUrl|loaderUrl)\s*(?::|=)\s*(?:buildUrl\s*\+\s*["']\/|["'](?:Build\/)?)([^"']+)["']/g
  );

  for (const match of urlMatches) {
    if (match[1]) {
      activeFiles.add(path.basename(match[1].trim()));
    }
  }

  return activeFiles.size > 0 ? activeFiles : null;
}

function splitFile(filePath) {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  const fileName = path.basename(filePath);
  const dir = path.dirname(filePath);

  if (fileSize <= CHUNK_SIZE) {
    console.log(`Skipping ${fileName} (Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB <= ${CHUNK_SIZE_MB} MB)`);
    return;
  }

  // Remove any existing parts for this file to avoid stale or orphaned chunks
  const oldParts = fs.readdirSync(dir).filter(f => f.startsWith(`${fileName}.part`));
  if (oldParts.length > 0) {
    console.log(`Cleaning up ${oldParts.length} existing part file(s) for ${fileName}...`);
    for (const oldPart of oldParts) {
      fs.unlinkSync(path.join(dir, oldPart));
    }
  }

  console.log(`Splitting ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB) into ~${CHUNK_SIZE_MB}MB parts...`);
  
  const buffer = Buffer.alloc(CHUNK_SIZE);
  const fd = fs.openSync(filePath, 'r');
  let bytesRead = 0;
  let partIndex = 1;
  const parts = [];

  while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) > 0) {
    const partName = `${fileName}.part${partIndex}`;
    const partPath = path.join(dir, partName);
    fs.writeFileSync(partPath, buffer.subarray(0, bytesRead));
    parts.push(partName);
    console.log(`  -> Created ${partName} (${(bytesRead / (1024 * 1024)).toFixed(2)} MB)`);
    partIndex++;
  }

  fs.closeSync(fd);
  console.log(`Successfully split ${fileName} into ${parts.length} parts.\n`);
}

function run() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`Build directory not found at: ${BUILD_DIR}`);
    process.exit(1);
  }

  const activeFiles = getActiveBuildFiles();
  if (activeFiles) {
    console.log('Active files detected from index.html:');
    activeFiles.forEach(f => console.log(`  * ${f}`));
    console.log('');
  }

  const files = fs.readdirSync(BUILD_DIR);

  // 1. Remove obsolete .part files that do not belong to active build
  for (const file of files) {
    const match = file.match(/^(.*)\.part\d+$/);
    if (match) {
      const baseName = match[1];
      if (activeFiles && !activeFiles.has(baseName)) {
        console.log(`Removing obsolete part file: ${file}`);
        fs.unlinkSync(path.join(BUILD_DIR, file));
      }
    }
  }

  // 2. Split active files > 50MB
  const refreshedFiles = fs.readdirSync(BUILD_DIR);
  for (const file of refreshedFiles) {
    if (file.endsWith('.part') || file.includes('.part')) continue;

    // Skip inactive files if index.html references specific build files
    if (activeFiles && !activeFiles.has(file)) {
      console.log(`Skipping inactive file: ${file} (not referenced in index.html)`);
      continue;
    }

    const fullPath = path.join(BUILD_DIR, file);
    if (fs.statSync(fullPath).isFile()) {
      splitFile(fullPath);
    }
  }
}

run();

