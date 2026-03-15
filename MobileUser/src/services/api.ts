import { Platform } from 'react-native';
import { EventItem, EventsResponse, UploadedMedia, UserReportPayload, UserSession } from '../types';

function getApiBaseUrl() {
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1';
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function registerUser(input: {
  phone: string;
  password: string;
  name: string;
  home_city?: string;
}): Promise<{ token: string; user: { id: string; name: string; phone: string } }> {
  const response = await fetch(`${getApiBaseUrl()}/auth/user/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = await parseJsonSafe<{
    token?: string;
    user?: { id: string; name: string; phone: string };
    error?: string;
  }>(response);

  if (!response.ok || !payload?.token || !payload.user) {
    throw new Error(payload?.error || 'User registration failed');
  }

  return { token: payload.token, user: payload.user };
}

export async function loginUser(input: {
  phone: string;
  password: string;
}): Promise<{ token: string; user: { id: string; name: string; phone: string } }> {
  const response = await fetch(`${getApiBaseUrl()}/auth/user/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = await parseJsonSafe<{
    token?: string;
    user?: { id: string; name: string; phone: string };
    error?: string;
  }>(response);

  if (!response.ok || !payload?.token || !payload.user) {
    throw new Error(payload?.error || 'Login failed');
  }

  return { token: payload.token, user: payload.user };
}

async function requestWithSession<T>(
  session: UserSession,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${session.token}`,
      ...(init?.headers || {}),
    },
  });

  const payload = await parseJsonSafe<{ error?: string } & T>(response);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload as T;
}

export async function fetchAvailableEvents(session: UserSession): Promise<EventItem[]> {
  const payload = await requestWithSession<EventsResponse>(session, '/user/events');
  return payload.data || [];
}

export async function uploadReportMedia(session: UserSession, mediaUri: string, mediaType: 'photo' | 'video') {
  const fileName = mediaType === 'photo' ? 'report.jpg' : 'report.mp4';
  const mimeType = mediaType === 'photo' ? 'image/jpeg' : 'video/mp4';

  const formData = new FormData();
  formData.append('media', {
    uri: mediaUri,
    name: fileName,
    type: mimeType,
  } as never);

  const response = await fetch(`${getApiBaseUrl()}/user/upload-media`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.token}`,
    },
    body: formData,
  });

  const payload = await parseJsonSafe<{ data?: UploadedMedia; error?: string }>(response);

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error || 'Media upload failed');
  }

  return payload.data;
}

export async function submitUserReport(session: UserSession, report: UserReportPayload) {
  return requestWithSession<{ message: string }>(session, '/user/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(report),
  });
}
