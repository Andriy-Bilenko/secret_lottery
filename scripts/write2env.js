import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '.env');

export const writeToEnv = (key, value) => {
  // Read current .env file
  let envContent = '';
  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, { encoding: 'utf8' });
  }

  // Split content into lines and update or add the key-value pair
  const lines = envContent.split('\n').filter(line => line.trim() !== '');
  const updatedLines = lines.map(line => {
    const [currentKey] = line.split('=');
    if (currentKey === key) {
      return `${key}=${value}`; // Update existing key
    }
    return line; // Keep existing line
  });

  // Check if the key was already in the file
  if (!updatedLines.some(line => line.startsWith(`${key}=`))) {
    updatedLines.push(`${key}=${value}`); // Add new key if it wasn't found
  }

  // Write the updated content back to the .env file
  fs.writeFileSync(envFilePath, updatedLines.join('\n') + '\n', { encoding: 'utf8' });
};

