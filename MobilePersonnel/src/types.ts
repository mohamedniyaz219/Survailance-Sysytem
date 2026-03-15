export type UserRole = 'admin' | 'responder' | 'analyst' | 'dispatcher';

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  badge_id: string | null;
  business_code: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  businessCode: string;
};

export type IncidentStatus = 'new' | 'assigned' | 'resolved' | 'false_alarm';

export type ResponderIncident = {
  id: string;
  type: string;
  description: string | null;
  source: string;
  confidence: number | null;
  status: IncidentStatus;
  verification_status: 'pending' | 'verified' | 'rejected';
  media_url: string | null;
  camera_id: number | null;
  camera_name: string | null;
  camera_location_name: string | null;
  assigned_responder_id: string | null;
  assigned_responder_name: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertsResponse = {
  data: ResponderIncident[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  location_name: string | null;
  start_at: string;
  end_at: string | null;
  status: string;
  is_active: boolean;
};

export type EventsResponse = {
  data: EventItem[];
};

export type AlertNavigationResponse = {
  data: {
    id: string;
    destination: {
      lat: number;
      lng: number;
    };
    googleDirectionsUrl: string;
    appleMapsUrl: string;
  };
};
