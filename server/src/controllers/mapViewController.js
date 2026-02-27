import db from '../models/index.js';

const { Camera, Incident, Zone, ZoneRiskScore, ResponderTracking, Sequelize } = db;

function extractPoint(geometry) {
  if (!geometry) return null;

  const coords = geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;

  return {
    lng: Number(coords[0]),
    lat: Number(coords[1])
  };
}

function buildBounds(points) {
  if (!points.length) {
    return {
      minLat: null,
      maxLat: null,
      minLng: null,
      maxLng: null
    };
  }

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
  };
}

export async function getMapOverview(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const tenantCamera = Camera.schema(schema);
    const tenantIncident = Incident.schema(schema);
    const tenantZone = Zone.schema(schema);
    const tenantZoneRiskScore = ZoneRiskScore.schema(schema);

    const [
      totalCameras,
      activeCameras,
      openIncidents,
      highRiskZones,
      cameras,
      incidents,
      responderTracks
    ] = await Promise.all([
      tenantCamera.count(),
      tenantCamera.count({ where: { status: 'online' } }),
      tenantIncident.count({ where: { status: { [Sequelize.Op.in]: ['new', 'assigned'] } } }),
      tenantZoneRiskScore.count({
        where: { risk_score: { [Sequelize.Op.gte]: 70 } }
      }),
      tenantCamera.findAll({
        attributes: ['id', 'name', 'location_name', 'zone_id', 'status', 'location'],
        include: [{ model: tenantZone, as: 'zone', attributes: ['id', 'name'], required: false }],
        order: [['createdAt', 'DESC']],
        limit: 100
      }),
      tenantIncident.findAll({
        attributes: ['id', 'type', 'status', 'description', 'location', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 100
      }),
      ResponderTracking.findAll({
        where: { tenant_schema: schema },
        attributes: ['id', 'responder_id', 'current_location', 'last_updated'],
        order: [['last_updated', 'DESC']],
        limit: 100
      })
    ]);

    const cameraPoints = cameras
      .map((camera) => {
        const point = extractPoint(camera.location);
        if (!point) return null;

        return {
          id: `camera-${camera.id}`,
          sourceId: camera.id,
          type: 'camera',
          title: camera.name || 'Camera',
          subtitle: camera.location_name || camera.zone?.name || 'Unknown location',
          status: camera.status,
          ...point
        };
      })
      .filter(Boolean);

    const incidentPoints = incidents
      .map((incident) => {
        const point = extractPoint(incident.location);
        if (!point) return null;

        return {
          id: `incident-${incident.id}`,
          sourceId: incident.id,
          type: 'incident',
          title: `Incident: ${incident.type}`,
          subtitle: incident.description || `Status: ${incident.status}`,
          status: incident.status,
          ...point
        };
      })
      .filter(Boolean);

    const responderPoints = responderTracks
      .map((track) => {
        const point = extractPoint(track.current_location);
        if (!point) return null;

        return {
          id: `responder-${track.id}`,
          sourceId: track.id,
          type: 'responder',
          title: 'Responder',
          subtitle: `Updated: ${track.last_updated}`,
          status: 'active',
          ...point
        };
      })
      .filter(Boolean);

    const mapPoints = [...cameraPoints, ...incidentPoints, ...responderPoints];

    return res.json({
      stats: {
        totalCameras,
        activeCameras,
        openIncidents,
        highRiskZones,
        trackedResponders: responderPoints.length
      },
      points: mapPoints,
      bounds: buildBounds(mapPoints)
    });
  } catch (err) {
    return next(err);
  }
}
