import fetch from 'node-fetch';
import { mustGet } from './env.js';

const AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

const SCOPES = [
  'com.intuit.quickbooks.accounting',
  'openid',
  'profile',
  'email',
].join(' ');

export function getAuthUrl(): string {
  const clientId = mustGet('QBO_CLIENT_ID');
  const redirectUri = mustGet('QBO_REDIRECT_URI');
  const state = 'ezcr-qbo-sync';

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  return `${AUTH_BASE}?${params.toString()}`;
}

export async function exchangeAuthCode(code: string, realmId: string) {
  const clientId = mustGet('QBO_CLIENT_ID');
  const clientSecret = mustGet('QBO_CLIENT_SECRET');
  const redirectUri = mustGet('QBO_REDIRECT_URI');

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${t}`);
  }

  const json = await res.json() as Record<string, unknown>;
  return { realmId, ...json };
}

export async function refreshAccessToken(refreshToken: string) {
  const clientId = mustGet('QBO_CLIENT_ID');
  const clientSecret = mustGet('QBO_CLIENT_SECRET');
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }
  return JSON.parse(text) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    x_refresh_token_expires_in?: number;
    token_type: string;
  };
}
