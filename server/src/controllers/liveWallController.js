import db from '../models/index.js';
import { spawnTranscoder } from '../services/videoService.js';
const { Camera, Zone, Incident, Sequelize } = db;

const FEED_LIMIT = 50;
const TIMELINE_WINDOW_HOURS = 12;

function extractPoint(geometry) {
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { lat: null, lng: null };
  }
  return { lng: Number(coords[0]), lat: Number(coords[1]) };
}

function toEventType(incidentType) {
  if (!incidentType) return 'intelligent-detection';
  if (['fire', 'weapon', 'fight', 'accident'].includes(incidentType)) return 'intelligent-detection';
  return 'all-events';
}

function toEventTitle(incident) {
  if (incident?.description?.trim()) return incident.description.trim();
  if (!incident?.type) return 'Intelligent Detection';

  const label = incident.type.charAt(0).toUpperCase() + incident.type.slice(1);
  return `${label} detected`;
}

function minuteOfDay(dateValue) {
  const date = new Date(dateValue);
  return date.getHours() * 60 + date.getMinutes();
}

function timeLabel(dateValue) {
  return new Date(dateValue).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDay(dateValue) {
  return new Date(dateValue).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit'
  });
}

function buildTimeline(incidents = [], now = new Date()) {
  const startWindow = new Date(now.getTime() - TIMELINE_WINDOW_HOURS * 60 * 60 * 1000);
  const rows = incidents
    .filter((item) => new Date(item.createdAt) >= startWindow)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const clips = rows.map((incident) => ({
    id: incident.id,
    minute: minuteOfDay(incident.createdAt),
    time: timeLabel(incident.createdAt),
    title: toEventTitle(incident),
    eventType: toEventType(incident.type),
    thumbnail: incident.media_url || null,
    status: incident.status
  }));

  const bucketMap = new Map();
  clips.forEach((clip) => {
    const bucketStart = Math.floor(clip.minute / 120) * 120;
    if (!bucketMap.has(bucketStart)) {
      bucketMap.set(bucketStart, []);
    }
    bucketMap.get(bucketStart).push(clip);
  });

  const cards = Array.from(bucketMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucketStart, clipItems]) => {
      const hour = Math.floor(bucketStart / 60) % 24;
      const minute = bucketStart % 60;
      const bucketTime = new Date(now);
      bucketTime.setHours(hour, minute, 0, 0);

      return {
        id: `bucket-${bucketStart}`,
        time: timeLabel(bucketTime),
        clipCount: clipItems.length,
        preview: clipItems[0]?.thumbnail || null,
        items: clipItems
      };
    });

  const ticks = [];
  for (let i = TIMELINE_WINDOW_HOURS; i >= 0; i -= 2) {
    const tickDate = new Date(now.getTime() - i * 60 * 60 * 1000);
    ticks.push({
      minute: minuteOfDay(tickDate),
      label: timeLabel(tickDate)
    });
  }

  return {
    startMinute: minuteOfDay(startWindow),
    endMinute: minuteOfDay(now),
    nowLabel: timeLabel(now),
    ticks,
    clips,
    cards
  };
}

export async function getCameras(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const tenantCamera = Camera.schema(schema);
    const tenantZone = Zone.schema(schema);

    const cameras = await tenantCamera.findAll({
      include: [{ model: tenantZone, as: 'zone', attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'DESC']]
    });
    res.json(cameras);
  } catch (err) {
    next(err);
  }
}

export async function startStream(req, res, next) {
  try {
    const { id } = req.params;
    const schema = req.tenantSchema;
    const tenantCamera = Camera.schema(schema);

    const camera = await tenantCamera.findOne({ where: { id } });
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    let streamUrl;
    try {
      // Returns the HLS URL (e.g., /hls/cam_1/index.m3u8)
      streamUrl = await spawnTranscoder(camera.rtsp_url, camera.id);
    } catch (streamErr) {
      if (streamErr?.code === 'FFMPEG_MISSING') {
        return res.status(503).json({ error: streamErr.message });
      }
      throw streamErr;
    }

    res.json({ streamUrl });
  } catch (err) {
    next(err);
  }
}

export async function getLiveWallOverview(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const tenantCamera = Camera.schema(schema);
    const tenantZone = Zone.schema(schema);
    const tenantIncident = Incident.schema(schema);

    const cameras = await tenantCamera.findAll({
      include: [{ model: tenantZone, as: 'zone', attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'DESC']]
    });

    const cameraMap = new Map(
      cameras.map((camera) => {
        const point = extractPoint(camera.location);
        return [camera.id, {
          id: camera.id,
          name: camera.name,
          zoneName: camera.zone?.name || null,
          status: camera.status,
          locationName: camera.location_name,
          lat: point.lat,
          lng: point.lng
        }];
      })
    );

    const recentIncidents = await tenantIncident.findAll({
      where: {
        camera_id: {
          [Sequelize.Op.ne]: null
        }
      },
      order: [['createdAt', 'DESC']],
      limit: FEED_LIMIT
    });

    const feed = recentIncidents.map((incident) => {
      const linkedCamera = cameraMap.get(incident.camera_id);
      return {
        id: incident.id,
        cameraId: incident.camera_id,
        cameraName: linkedCamera?.name || `Camera ${incident.camera_id}`,
        cameraZone: linkedCamera?.zoneName || null,
        title: toEventTitle(incident),
        eventType: toEventType(incident.type),
        status: incident.status,
        timestamp: incident.createdAt,
        timeLabel: timeLabel(incident.createdAt),
        dayLabel: formatDay(incident.createdAt),
        thumbnail: incident.media_url || null
      };
    });

    const selectedCameraId = Number(req.query.cameraId) || cameras[0]?.id || null;

    const timelineIncidents = selectedCameraId
      ? await tenantIncident.findAll({
          where: {
            camera_id: selectedCameraId
          },
          order: [['createdAt', 'DESC']],
          limit: 200
        })
      : [];

    const timeline = buildTimeline(timelineIncidents, new Date());

    return res.json({
      cameras: Array.from(cameraMap.values()),
      selectedCameraId,
      feed,
      timeline
    });
  } catch (err) {
    return next(err);
  }
}

export async function getLiveWallTimeline(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const tenantIncident = Incident.schema(schema);
    const cameraId = Number(req.query.cameraId);

    if (!cameraId) {
      return res.status(400).json({ error: 'cameraId is required' });
    }

    const incidents = await tenantIncident.findAll({
      where: {
        camera_id: cameraId
      },
      order: [['createdAt', 'DESC']],
      limit: 200
    });

    return res.json({
      cameraId,
      timeline: buildTimeline(incidents, new Date())
    });
  } catch (err) {
    return next(err);
  }
}