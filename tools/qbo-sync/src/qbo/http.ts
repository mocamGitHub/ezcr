import fetch from 'node-fetch';
import { getMinorVersion, mustGet } from './env.js';
import { refreshAccessToken } from './oauth.js';

export type QboAuthState = {
  accessToken: string;
  refreshToken: string;
  refreshedAt: number;
  expiresInSec: number;
};

function nowSec() { return Math.floor(Date.now() / 1000); }

export async function getAuthState(): Promise<QboAuthState> {
  const refreshToken = mustGet('QBO_REFRESH_TOKEN');
  // Always refresh on startup; it's simpler and keeps access tokens short-lived.
  const refreshed = await refreshAccessToken(refreshToken);
  const newRefreshToken = refreshed.refresh_token ?? refreshToken;

  // Print the new refresh token if it rotates so callers can persist it (CI/CD secret update etc.)
  if (newRefreshToken !== refreshToken) {
    console.log('[QBO] Refresh token rotated. Update QBO_REFRESH_TOKEN to the newest value.');
  }

  return {
    accessToken: refreshed.access_token,
    refreshToken: newRefreshToken,
    refreshedAt: nowSec(),
    expiresInSec: refreshed.expires_in,
  };
}

export function qboBaseUrl(): string {
  return 'https://quickbooks.api.intuit.com';
}

export async function qboGet(path: string, auth: QboAuthState): Promise<any> {
  const minor = getMinorVersion();
  const url = new URL(`${qboBaseUrl()}${path}`);
  // set minorversion if not present
  if (!url.searchParams.has('minorversion')) url.searchParams.set('minorversion', minor);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${auth.accessToken}`,
      'Accept': 'application/json',
    }
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`QBO GET failed: ${res.status} ${text}`);
  }
  return JSON.parse(text);
}
