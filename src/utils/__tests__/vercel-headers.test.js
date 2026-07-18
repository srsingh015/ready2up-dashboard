import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Config assertion test for production security headers declared in vercel.json.
// _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6_

function findHeader(headers, key) {
  return headers.find((h) => String(h.key).toLowerCase() === key.toLowerCase());
}

describe('vercel.json production security headers', () => {
  let config;
  let allRoutesRule;
  let headers;

  beforeAll(() => {
    // Read vercel.json via node fs relative to the project root (cwd is project root under vitest).
    const configPath = path.resolve(process.cwd(), 'vercel.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(raw);
    expect(Array.isArray(config.headers)).toBe(true);
    // A headers rule applying to all routes must exist.
    allRoutesRule = config.headers.find((rule) => rule.source === '/(.*)');
    expect(allRoutesRule, "a headers rule for source '/(.*)' must exist").toBeTruthy();
    expect(Array.isArray(allRoutesRule.headers)).toBe(true);
    headers = allRoutesRule.headers;
  });

  it('parses vercel.json as valid JSON with a headers rule', () => {
    expect(config).toBeTypeOf('object');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('declares a Content-Security-Policy with the required directives (Req 12.2)', () => {
    const csp = findHeader(headers, 'Content-Security-Policy');
    expect(csp, 'Content-Security-Policy header must be present').toBeTruthy();
    const value = csp.value;
    expect(value).toContain("default-src 'self'");
    // connect-src must allow Supabase over https + wss or auth/content/realtime break.
    expect(value).toMatch(/connect-src[^;]*https:\/\/\*\.supabase\.co/);
    expect(value).toMatch(/connect-src[^;]*wss:\/\/\*\.supabase\.co/);
    // Clickjacking protection via CSP.
    expect(value).toContain("frame-ancestors 'none'");
  });

  it('declares HSTS with max-age >= 31536000 (Req 12.3)', () => {
    const hsts = findHeader(headers, 'Strict-Transport-Security');
    expect(hsts, 'Strict-Transport-Security header must be present').toBeTruthy();
    const match = /max-age=(\d+)/.exec(hsts.value);
    expect(match, 'HSTS must declare a max-age').toBeTruthy();
    expect(Number(match[1])).toBeGreaterThanOrEqual(31536000);
  });

  it('sets X-Content-Type-Options to nosniff (Req 12.5)', () => {
    const xcto = findHeader(headers, 'X-Content-Type-Options');
    expect(xcto, 'X-Content-Type-Options header must be present').toBeTruthy();
    expect(xcto.value).toBe('nosniff');
  });

  it('sets a Referrer-Policy of strict-origin-when-cross-origin or stricter (Req 12.6)', () => {
    const referrer = findHeader(headers, 'Referrer-Policy');
    expect(referrer, 'Referrer-Policy header must be present').toBeTruthy();
    const acceptable = ['strict-origin-when-cross-origin', 'strict-origin', 'same-origin', 'no-referrer'];
    expect(acceptable).toContain(referrer.value);
  });

  it('provides clickjacking protection via X-Frame-Options (Req 12.4)', () => {
    const xfo = findHeader(headers, 'X-Frame-Options');
    expect(xfo, 'X-Frame-Options header must be present').toBeTruthy();
    expect(['DENY', 'SAMEORIGIN']).toContain(xfo.value);
  });
});
