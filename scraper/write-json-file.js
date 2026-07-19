import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export function writeJsonFile(filePath, value) {
  const serialized = JSON.stringify(value, null, 2);
  const tempFile = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    fs.writeFileSync(tempFile, serialized, 'utf8');
    fs.renameSync(tempFile, filePath);
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
}
