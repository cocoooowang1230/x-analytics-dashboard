import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import test from 'node:test';

import { writeJsonFile } from './write-json-file.js';

function withTempDirectory(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xpulse-json-'));

  try {
    run(directory);
  } finally {
    fs.rmSync(directory, { force: true, recursive: true });
  }
}

test('atomically replaces JSON without leaving its temporary file', () => {
  withTempDirectory((directory) => {
    const filePath = path.join(directory, 'data.json');
    fs.writeFileSync(filePath, '{"old":true}', 'utf8');

    writeJsonFile(filePath, { current: { followers: 42 } });

    assert.deepEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), {
      current: { followers: 42 },
    });
    assert.deepEqual(fs.readdirSync(directory), ['data.json']);
  });
});

test('does not reuse another writer temporary path', () => {
  withTempDirectory((directory) => {
    const filePath = path.join(directory, 'data.json');
    const otherWriterTempFile = `${filePath}.tmp`;
    fs.writeFileSync(otherWriterTempFile, 'in progress', 'utf8');

    writeJsonFile(filePath, { current: { followers: 84 } });

    assert.equal(fs.readFileSync(otherWriterTempFile, 'utf8'), 'in progress');
    assert.deepEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), {
      current: { followers: 84 },
    });
  });
});
