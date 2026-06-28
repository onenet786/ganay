import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadYtDlp() {
  const binDir = path.join(__dirname, '..', 'bin');
  const destPath = path.join(binDir, 'yt-dlp.exe');

  if (fs.existsSync(destPath)) {
    console.log(`yt-dlp.exe already exists at ${destPath}. Skipping download.`);
    return;
  }

  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  console.log('Downloading yt-dlp.exe from GitHub...');
  const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download yt-dlp: status ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    console.log(`Successfully downloaded yt-dlp.exe to ${destPath}`);
  } catch (error) {
    console.error('Error downloading yt-dlp:', error.message);
    process.exit(1);
  }
}

downloadYtDlp();
