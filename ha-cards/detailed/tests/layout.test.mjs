import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const cardSource = readFileSync(new URL('../src/ugreen-nas-card.ts', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../src/styles.ts', import.meta.url), 'utf8');

test('keeps selected project details beside storage pools on desktop', () => {
  assert.match(cardSource, /private renderStorageSection\(\)[\s\S]*?<section class="storage">/);
  assert.match(stylesSource, /\.storage\s*\{[\s\S]*?grid-template-columns:\s*1\.05fr 1fr;/);
  assert.doesNotMatch(cardSource, /project-detail-active/);
  assert.doesNotMatch(stylesSource, /project-detail-active/);
});
