import db from '../models/index.js';
import { findNearestResponder } from '../services/responderAssignmentService.js';
import {
  resolveAreaSqm,
  classifyDensity,
  detectFlowDirection,
  detectSuddenSurge
} from '../services/crowdAnalyticsService.js';

const { Incident, Camera, Personnel, IncidentHistory, CrowdMetric } = db;
const surgeAlertCooldown = new Map();
const SURGE_ALERT_COOLDOWN_MS = Number(process.env.CROWD_SURGE_ALERT_COOLDOWN_MS || 120000);

function normalizeIncidentType(rawType) {
  const value = String(rawType || '').trim().toLowerCase();
  if (!value) return 'accident';

  if (value.includes('weapon')) return 'weapon';
  if (value.includes('fire')) return 'fire';
  if (value.includes('fight')) return 'fight';
  if (value.includes('crowd')) return 'crowd';
  return 'accident';
}

function normalizeConfidence(confidence) {
  const parsed = Number(confidence);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.min(1, parsed));
}

function normalizePeopleCount(rawCount) {
  const parsed = Number(rawCount);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}

async function persistCrowdMetric({
  schema,
  camera,
  payload,
  tenantCrowdMetric,
  tenantIncident,
  tenantIncidentHistory,
  req
}) {
  const normalizedCount = normalizePeopleCount(payload.people_count);
  if (normalizedCount === null) {
    return null;
  }

  const recentMetrics = await tenantCrowdMetric.findAll({
    where: { camera_id: camera.id },
    attributes: ['people_count', 'flow_direction', 'captured_at'],
    order: [['captured_at', 'DESC']],
    limit: 6
  });

  const previousMetric = recentMetrics[0] || null;
  const recentCounts = recentMetrics.map((item) => Number(item.people_count || 0)).reverse();
  const areaSqm = resolveAreaSqm(payload.area_sqm);
  const { densityLevel, densityPerSqm } = classifyDensity(normalizedCount, areaSqm);
  const flowDirection = detectFlowDirection({
    peopleCount: normalizedCount,
    previousCount: previousMetric?.people_count ?? normalizedCount,
    prevDirection: previousMetric?.flow_direction,
    recentCounts
  });

  const capturedAt = payload.timestamp ? new Date(payload.timestamp) : new Date();

  const createdMetric = await tenantCrowdMetric.create({
    camera_id: camera.id,
    people_count: normalizedCount,
    density_level: densityLevel,
    flow_direction: flowDirection,
    captured_at: capturedAt
  });

  const surge = detectSuddenSurge({
    peopleCount: normalizedCount,
    recentCounts
  });

  if (surge.isSurge) {
    const cooldownKey = `${schema}:${camera.id}`;
    const now = Date.now();
    const lastTriggered = surgeAlertCooldown.get(cooldownKey) || 0;

    if (now - lastTriggered > SURGE_ALERT_COOLDOWN_MS) {
      surgeAlertCooldown.set(cooldownKey, now);

      const surgeIncident = await tenantIncident.create({
        type: 'crowd',
        detected_class: 'crowd_surge',
        confidence: null,
        source: 'AI',
        status: 'new',
        camera_id: camera.id,
        assigned_responder_id: null,
        location: camera.location,
        media_url: null,
        description: `Stampede risk: count jumped to ${normalizedCount} (baseline ${surge.baseline}, ratio ${surge.ratio}x).`,
        createdAt: capturedAt
      });

      await tenantIncidentHistory.create({
        incident_id: surgeIncident.id,
        action_by: null,
        action: 'crowd_surge_detected',
        prev_status: null,
        new_status: 'new',
        comment: `Surge delta ${surge.delta} with density ${densityLevel} (${densityPerSqm}/sqm).`,
        timestamp: new Date()
      });

      if (req.io) {
        req.io.to(req.businessCode).emit('CROWD_SURGE_ALERT', {
          incidentId: surgeIncident.id,
          camera_id: camera.id,
          camera_name: camera.name,
          people_count: normalizedCount,
          density_level: densityLevel,
          density_per_sqm: densityPerSqm,
          flow_direction: flowDirection,
          baseline: surge.baseline,
          ratio: surge.ratio,
          delta: surge.delta,
          captured_at: capturedAt
        });
      }
    }
  }

  return {
    ...createdMetric.toJSON(),
    density_per_sqm: densityPerSqm,
    area_sqm: areaSqm
  };
}

export async function receiveAIAlert(req, res, next) {
  try {
    const { camera_id: cameraId, type, confidence, image, timestamp } = req.body || {};
    const schema = req.tenantSchema;

    if (!cameraId || !type) {
      return res.status(400).json({ error: 'camera_id and type are required' });
    }

    const tenantCamera = Camera.schema(schema);
    const tenantIncident = Incident.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);
    const tenantIncidentHistory = IncidentHistory.schema(schema);
    const tenantCrowdMetric = CrowdMetric.schema(schema);

    const camera = await tenantCamera.findByPk(cameraId);
    if (!camera) {
      return res.status(404).json({ error: 'Unknown camera' });
    }

    const detectedClass = String(type).trim();
    const normalizedType = normalizeIncidentType(type);
    const normalizedConfidence = normalizeConfidence(confidence);

    const crowdMetricPayload = await persistCrowdMetric({
      schema,
      camera,
      payload: req.body || {},
      tenantCrowdMetric,
      tenantIncident,
      tenantIncidentHistory,
      req
    });

    const nearest = await findNearestResponder({
      schema,
      incidentLocation: camera.location
    });

    const incident = await tenantIncident.create({
      type: normalizedType,
      detected_class: detectedClass,
      confidence: normalizedConfidence,
      confidence_score: normalizedConfidence,
      source: 'AI',
      status: nearest ? 'assigned' : 'new',
      camera_id: camera.id,
      assigned_responder_id: nearest?.responderId || null,
      location: camera.location,
      media_url: image || null,
      description: `AI detected ${detectedClass} with confidence ${normalizedConfidence ?? 'N/A'}`,
      createdAt: timestamp ? new Date(timestamp) : undefined
    });

    await tenantIncidentHistory.create({
      incident_id: incident.id,
      action_by: null,
      action: nearest ? 'auto_assigned_by_system' : 'created_by_ai',
      prev_status: null,
      new_status: incident.status,
      comment: nearest
        ? `Auto-assigned to nearest responder (${nearest.responderName || nearest.responderId})`
        : 'No nearby responder found for auto-assignment',
      timestamp: new Date()
    });

    let responderDetails = null;
    if (nearest?.responderId) {
      responderDetails = await tenantPersonnel.findByPk(nearest.responderId, {
        attributes: ['id', 'name', 'badge_id']
      });
    }

    if (req.io) {
      req.io.to(req.businessCode).emit('CRITICAL_ALERT', {
        incidentId: incident.id,
        camera_id: camera.id,
        camera_name: camera.name,
        type: incident.type,
        detected_class: incident.detected_class,
        confidence: incident.confidence,
        status: incident.status,
        assigned_responder_id: incident.assigned_responder_id,
        assigned_responder_name: responderDetails?.name || null
      });
    }

    return res.status(201).json({
      success: true,
      incidentId: incident.id,
      status: incident.status,
      crowdMetric: crowdMetricPayload,
      autoAssignedResponder: nearest
        ? {
            id: nearest.responderId,
            name: responderDetails?.name || nearest.responderName,
            badge_id: responderDetails?.badge_id || nearest.responderBadgeId,
            distance_meters: Number(nearest.distanceMeters.toFixed(2))
          }
        : null
    });
  } catch (err) {
    return next(err);
  }
}
