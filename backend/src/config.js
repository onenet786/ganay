import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or parent root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const config = {
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  YTDLP_PATH: process.env.YTDLP_PATH || path.join(
    __dirname, 
    '..', 
    'bin', 
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  ),
  DB_FILE_PATH: path.join(__dirname, '..', 'data', 'db.json'),
};
