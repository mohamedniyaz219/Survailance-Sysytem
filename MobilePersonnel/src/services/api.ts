import { Platform } from 'react-native';
import {
  AlertNavigationResponse,
  AlertsResponse,
  AuthSession,
  EventsResponse,
} from '../types';

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

async function requestWithSession<T>(
  session: AuthSession,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`,
      'x-business-code': session.businessCode,
      ...(init?.headers || {}),
    },
  });

  const payload = await parseJsonSafe<{ error?: string } & T>(response);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload as T;
}

export async function loginOfficial(
  businessCode: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  const normalizedBusinessCode = businessCode.trim().toUpperCase();

  const response = await fetch(`${getApiBaseUrl()}/auth/official/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-business-code': normalizedBusinessCode,
    },
    body: JSON.stringify({
      business_code: normalizedBusinessCode,
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const payload = await parseJsonSafe<{
    token?: string;
    user?: AuthSession['user'];
    error?: string;
  }>(response);

  if (!response.ok || !payload?.token || !payload.user) {
    throw new Error(payload?.error || 'Unable to authenticate responder');
  }

  if (payload.user.role !== 'responder') {
    throw new Error('Only responder accounts can sign in here.');
  }

  return {
    token: payload.token,
    user: payload.user,
    businessCode: normalizedBusinessCode,
  };
}

export async function fetchResponderAlerts(session: AuthSession) {
  return requestWithSession<AlertsResponse>(session, '/official/alerts?page=1&limit=50');
}

export async function fetchResponderEvents(session: AuthSession) {
  return requestWithSession<EventsResponse>(session, '/official/events');
}

export async function fetchAlertNavigation(session: AuthSession, alertId: string) {
  return requestWithSession<AlertNavigationResponse>(
    session,
    `/official/alerts/${alertId}/navigation`,
  );
}

export async function updateAlertStatus(
  session: AuthSession,
  alertId: string,
  status: 'assigned' | 'resolved',
) {
  return requestWithSession<{ data: { id: string; status: string } }>(
    session,
    `/official/alerts/${alertId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
}
