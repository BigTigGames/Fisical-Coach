const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'Build');
const INDEX_HTML = path.join(__dirname, 'index.html');

function getActiveDataFile() {
  if (!fs.existsSync(INDEX_HTML)) {
    return null;
  }
  const content = fs.readFileSync(INDEX_HTML, 'utf8');
  const match = content.match(/dataUrl\s*:\s*(?:buildUrl\s*\+\s*["']\/|["'](?:Build\/)?)([^"']+)["']/);
  if (match && match[1]) {
    return path.basename(match[1].trim());
  }
  return null;
}

function mergeFiles() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`Build directory not found at: ${BUILD_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(BUILD_DIR);
  const activeDataFile = getActiveDataFile();

  // Find all distinct base file names from .part1 files
  const baseFiles = new Set();

  for (const file of files) {
    const match = file.match(/^(.*)\.part1$/);
    if (match) {
      const baseName = match[1];
      if (activeDataFile && baseName !== activeDataFile) {
        console.log(`Skipping inactive part sequence: ${baseName}`);
        continue;
      }
      baseFiles.add(baseName);
    }
  }

  if (baseFiles.size === 0) {
    console.log('No split .part files found to merge.');
    return;
  }

  for (const baseFileName of baseFiles) {
    const targetPath = path.join(BUILD_DIR, baseFileName);
    console.log(`\nMerging parts for: ${baseFileName}...`);

    // Find all parts in order
    let partIndex = 1;
    const parts = [];
    while (true) {
      const partName = `${baseFileName}.part${partIndex}`;
      const partPath = path.join(BUILD_DIR, partName);
      if (fs.existsSync(partPath)) {
        parts.push(partPath);
        partIndex++;
      } else {
        break;
      }
    }

    if (parts.length === 0) {
      console.warn(`No parts found for ${baseFileName}`);
      continue;
    }

    console.log(`Found ${parts.length} parts for ${baseFileName}`);

    // Temporary target file to ensure atomic write
    const tempTargetPath = targetPath + '.tmp';
    const outFd = fs.openSync(tempTargetPath, 'w');

    let totalBytes = 0;
    const buffer = Buffer.alloc(64 * 1024 * 1024); // 64MB buffer

    for (const partPath of parts) {
      const inFd = fs.openSync(partPath, 'r');
      let bytesRead = 0;
      let partBytes = 0;

      while ((bytesRead = fs.readSync(inFd, buffer, 0, buffer.length, null)) > 0) {
        fs.writeSync(outFd, buffer, 0, bytesRead);
        partBytes += bytesRead;
      }

      fs.closeSync(inFd);
      totalBytes += partBytes;
      console.log(`  + Merged ${path.basename(partPath)} (${(partBytes / (1024 * 1024)).toFixed(2)} MB)`);
    }

    fs.closeSync(outFd);

    // Replace original target file with temp file
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    fs.renameSync(tempTargetPath, targetPath);

    console.log(`Successfully recreated ${baseFileName} (Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`);
  }
  console.log('\nAll parts merged successfully for Netlify deployment.');
}

mergeFiles();
