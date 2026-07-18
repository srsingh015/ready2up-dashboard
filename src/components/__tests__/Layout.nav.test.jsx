// Unit test for Institute Outreach navigation registration in Layout.jsx.
// Asserts exactly one execution-group NAV entry with id 'institute-outreach'
// (non-empty label + icon) and a matching renderSection() case, without
// overriding the app's noindex/password-gate behaviour.
// Validates: Requirements 1.1, 1.2
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutSource = readFileSync(resolve(__dirname, '../Layout.jsx'), 'utf8');

describe('Layout — Institute Outreach nav registration', () => {
  it('registers exactly one NAV entry with id institute-outreach in the execution group', () => {
    const navMatches = layoutSource.match(/id:\s*'institute-outreach'/g) || [];
    expect(navMatches).toHaveLength(1);

    // The entry declares a non-empty label, a GraduationCap icon, and the
    // execution group, all on the same NAV line.
    const navLine = layoutSource
      .split('\n')
      .find((l) => l.includes("id: 'institute-outreach'") && l.includes('group:'));
    expect(navLine).toBeDefined();
    expect(navLine).toMatch(/label:\s*'[^']+'/);
    expect(navLine).toMatch(/icon:\s*GraduationCap/);
    expect(navLine).toMatch(/group:\s*'execution'/);
  });

  it('imports the GraduationCap icon and the InstituteOutreach section', () => {
    expect(layoutSource).toMatch(/GraduationCap/);
    expect(layoutSource).toMatch(
      /import\s+InstituteOutreach\s+from\s+'\.\/sections\/InstituteOutreach\.jsx'/
    );
  });

  it('has a renderSection case for the institute-outreach id', () => {
    expect(layoutSource).toMatch(
      /case\s*'institute-outreach':\s*return\s*<InstituteOutreach\s*\{\.\.\.props\}\s*\/>;/
    );
  });
});
