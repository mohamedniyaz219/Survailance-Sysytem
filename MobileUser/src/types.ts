export type AuthUser = {
  id: string;
  name: string | null;
  phone: string;
};

export type UserSession = {
  token: string;
  user: AuthUser;
};

export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  event_type: string | null;
  location_name: string | null;
  start_at: string;
  status: string;
};

export type EventsResponse = {
  data: EventItem[];
};

export type UploadedMedia = {
  media_url: string;
  media_type: 'photo' | 'video' | 'unknown';
};

export type UserReportPayload = {
  event_id: number;
  incident_type: string;
  description: string;
  location_name: string;
  lat: number;
  lng: number;
  media_url: string | null;
  media_type: 'photo' | 'video' | 'unknown';
};
