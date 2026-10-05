const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'Build');
const CHUNK_SIZE_MB = 50; // 50MB per chunk, well below GitHub 100MB limit
const CHUNK_SIZE = CHUNK_SIZE_MB * 1024 * 1024;

function splitFile(filePath) {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  const fileName = path.basename(filePath);

  if (fileSize <= CHUNK_SIZE) {
    console.log(`Skipping ${fileName} (Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB <= ${CHUNK_SIZE_MB} MB)`);
    return;
  }

  console.log(`Splitting ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB) into ~${CHUNK_SIZE_MB}MB parts...`);
  
  const buffer = Buffer.alloc(CHUNK_SIZE);
  const fd = fs.openSync(filePath, 'r');
  let bytesRead = 0;
  let partIndex = 1;
  const parts = [];

  while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) > 0) {
    const partName = `${fileName}.part${partIndex}`;
    const partPath = path.join(path.dirname(filePath), partName);
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

  const files = fs.readdirSync(BUILD_DIR);
  for (const file of files) {
    if (file.endsWith('.part') || file.includes('.part')) continue;
    const fullPath = path.join(BUILD_DIR, file);
    if (fs.statSync(fullPath).isFile()) {
      splitFile(fullPath);
    }
  }
}

run();
