import db from '../models/index.js';

const { Personnel, ResponderTracking } = db;

function extractPoint(geometry) {
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }
  return {
    lng: Number(coords[0]),
    lat: Number(coords[1])
  };
}

function haversineMeters(pointA, pointB) {
  const toRad = (value) => (value * Math.PI) / 180;

  const earthRadiusMeters = 6371000;
  const latDiff = toRad(pointB.lat - pointA.lat);
  const lngDiff = toRad(pointB.lng - pointA.lng);

  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);

  const h =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusMeters * c;
}

export async function findNearestResponder({ schema, incidentLocation }) {
  const incidentPoint = extractPoint(incidentLocation);
  if (!incidentPoint) {
    return null;
  }

  const tenantPersonnel = Personnel.schema(schema);
  const responders = await tenantPersonnel.findAll({
    where: {
      role: 'responder',
      is_active: true
    },
    attributes: ['id', 'name', 'badge_id']
  });

  if (!responders.length) {
    return null;
  }

  const responderIdSet = new Set(responders.map((item) => item.id));
  const trackingRows = await ResponderTracking.findAll({
    where: {
      tenant_schema: schema,
      responder_id: Array.from(responderIdSet)
    },
    attributes: ['responder_id', 'current_location', 'last_updated'],
    order: [['last_updated', 'DESC']]
  });

  const latestByResponder = new Map();
  for (const track of trackingRows) {
    if (!latestByResponder.has(track.responder_id)) {
      latestByResponder.set(track.responder_id, track);
    }
  }

  let best = null;

  for (const responder of responders) {
    const latestTrack = latestByResponder.get(responder.id);
    const responderPoint = extractPoint(latestTrack?.current_location);
    if (!responderPoint) continue;

    const distanceMeters = haversineMeters(incidentPoint, responderPoint);
    if (!best || distanceMeters < best.distanceMeters) {
      best = {
        responderId: responder.id,
        responderName: responder.name,
        responderBadgeId: responder.badge_id,
        distanceMeters,
        trackedAt: latestTrack.last_updated
      };
    }
  }

  return best;
}
