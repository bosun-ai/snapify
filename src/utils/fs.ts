import { access, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

export async function ensureDir(targetPath: string) {
  await mkdir(targetPath, { recursive: true });
}

export async function fileExists(targetPath: string) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function writeFileRecursive(filePath: string, content: string | Buffer) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content);
}
