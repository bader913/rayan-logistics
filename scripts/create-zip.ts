// scripts/create-zip.ts
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function createProjectZip() {
  console.log('====================================================');
  console.log('  Packaging Rayan Logistics Full Project ZIP (JSZip)');
  console.log('====================================================');

  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const zip = new JSZip();

  const ignoredPatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    'logs',
    'uploads',
    '.DS_Store',
    'rayan-logistics-initial.zip',
    '.env',
    '.env.local',
    '.env.development',
    '.env.production'
  ];

  let fileCount = 0;

  function addDirectory(currentDir: string, relativePath: string = '') {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      if (ignoredPatterns.includes(item) || item.endsWith('.log') || item.endsWith('.sqlite')) {
        continue;
      }
      const fullItemPath = path.join(currentDir, item);
      const zipEntryPath = relativePath ? `${relativePath}/${item}` : item;
      const stat = fs.statSync(fullItemPath);

      if (stat.isDirectory()) {
        addDirectory(fullItemPath, zipEntryPath);
      } else if (stat.isFile()) {
        const fileData = fs.readFileSync(fullItemPath);
        zip.file(zipEntryPath, fileData);
        fileCount++;
      }
    }
  }

  console.log('Adding workspace files...');
  addDirectory(rootDir);

  console.log(`Compressing ${fileCount} files into ZIP archive...`);
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const zipPath = path.join(publicDir, 'rayan-logistics-initial.zip');
  fs.writeFileSync(zipPath, content);

  const sizeMb = (content.length / 1024 / 1024).toFixed(2);
  console.log(`✅ Project successfully packaged into ZIP!`);
  console.log(`Location: ${zipPath}`);
  console.log(`Files count: ${fileCount}`);
  console.log(`Archive size: ${sizeMb} MB (${content.length} bytes)`);
  console.log(`Available via direct download in browser at: /rayan-logistics-initial.zip`);
}

createProjectZip().catch((err) => {
  console.error('Failed to create project ZIP:', err);
  process.exit(1);
});
