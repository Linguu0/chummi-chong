import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env') });

export const config = {
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
  },
  app: {
    name: 'Chummi Chong',
    version: '1.0.0',
    maxHistoryLength: 50,
  },
};

export function validateConfig(): boolean {
  if (!config.nvidia.apiKey) {
    console.error('❌ NVIDIA_API_KEY is not set! Add it to your .env file.');
    return false;
  }
  return true;
}
