import path from 'path';

export default async function globalSetup() {
  const patch = path.resolve(__dirname, 'jest-symbol-patch.cjs');
  const existing = process.env.NODE_OPTIONS ?? '';
  if (!existing.includes('jest-symbol-patch')) {
    process.env.NODE_OPTIONS = `${existing} --require ${patch}`.trim();
  }
}
