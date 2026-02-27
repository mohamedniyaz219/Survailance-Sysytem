import db from '../models/index.js';
const { Incident, Camera, Personnel, ZoneRiskScore, UserReport, CrowdMetric, Zone } = db;

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

function getDateKey(dateValue) {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function lastNDates(days) {
  const now = new Date();
  const list = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    list.push(date.toISOString().slice(0, 10));
  }
  return list;
}

function startOfDaysAgo(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function normalizeIncidentClass(incident) {
  const detected = String(incident.detected_class || '').trim();
  if (detected) return detected.toLowerCase();
  return String(incident.type || 'unknown').toLowerCase();
}

function isMissingRelationError(err) {
  return err?.original?.code === '42P01';
}

async function safeQuery(fn, fallbackValue) {
  try {
    return await fn();
  } catch (err) {
    if (isMissingRelationError(err)) {
      return fallbackValue;
    }
    throw err;
  }
}

function buildIncidentHeatmap(incidents) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const matrix = weekdays.map((day) => ({
    day,
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
  }));

  for (const item of incidents) {
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;
    const weekDay = createdAt.getDay();
    const hour = createdAt.getHours();
    matrix[weekDay].hours[hour].count += 1;
  }

  return matrix;
}

function buildLineSeries(incidents, userReports, crowdMetrics) {
  const dates = lastNDates(7);
  const incidentByDate = new Map(dates.map((date) => [date, 0]));
  const reportsByDate = new Map(dates.map((date) => [date, 0]));
  const crowdByDate = new Map(dates.map((date) => [date, { sum: 0, count: 0 }]));

  for (const item of incidents) {
    const key = getDateKey(item.createdAt);
    if (incidentByDate.has(key)) {
      incidentByDate.set(key, incidentByDate.get(key) + 1);
    }
  }

  for (const item of userReports) {
    const key = getDateKey(item.createdAt);
    if (reportsByDate.has(key)) {
      reportsByDate.set(key, reportsByDate.get(key) + 1);
    }
  }

  for (const item of crowdMetrics) {
    const key = getDateKey(item.captured_at);
    if (crowdByDate.has(key)) {
      const prev = crowdByDate.get(key);
      crowdByDate.set(key, {
        sum: prev.sum + Number(item.people_count || 0),
        count: prev.count + 1
      });
    }
  }

  return dates.map((date) => {
    const crowd = crowdByDate.get(date);
    const avgCrowd = crowd && crowd.count ? Number((crowd.sum / crowd.count).toFixed(1)) : 0;
    return {
      date,
      incidents: incidentByDate.get(date) || 0,
      userReports: reportsByDate.get(date) || 0,
      avgCrowd
    };
  });
}

function buildClassDistribution(incidents) {
  const counts = new Map();
  for (const item of incidents) {
    const label = normalizeIncidentClass(item);
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function getStats(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const tenantIncident = Incident.schema(schema);
    const tenantCamera = Camera.schema(schema);
    const tenantZoneRiskScore = ZoneRiskScore.schema(schema);

    const totalIncidents = await tenantIncident.count();
    const activeIncidents = await tenantIncident.count({
      where: { status: ['new', 'assigned'] }
    });
    const activeCameras = await tenantCamera.count({
      where: { status: 'online' }
    });
    const highRiskZones = await tenantZoneRiskScore.count({
      where: { risk_score: { [db.Sequelize.Op.gt]: 70 } }
    });

    res.json({
      totalIncidents,
      activeIncidents,
      activeCameras,
      highRiskZones
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivity(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const tenantIncident = Incident.schema(schema);
    // Get last 5 incidents
    const recent = await tenantIncident.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    res.json(recent);
  } catch (err) {
    next(err);
  }
}

export async function getDashboardOverview(req, res, next) {
  try {
    const schema = req.tenantSchema;

    const tenantIncident = Incident.schema(schema);
    const tenantCamera = Camera.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);
    const tenantZoneRiskScore = ZoneRiskScore.schema(schema);
    const tenantUserReport = UserReport.schema(schema);
    const tenantCrowdMetric = CrowdMetric.schema(schema);
    const tenantZone = Zone.schema(schema);

    const sevenDaysAgo = startOfDaysAgo(6);
    const fourteenDaysAgo = startOfDaysAgo(13);

    const [
      incidentRows,
      recentIncidentRows,
      userReportRows,
      recentUserReportRows,
      zoneRiskRows,
      crowdRows,
      cameraTotal,
      cameraActive,
      responderActive
    ] = await Promise.all([
      safeQuery(() => tenantIncident.findAll({
        where: { createdAt: { [db.Sequelize.Op.gte]: fourteenDaysAgo } },
        attributes: ['id', 'type', 'detected_class', 'status', 'createdAt', 'location'],
        order: [['createdAt', 'DESC']],
        limit: 5000
      }), []),
      safeQuery(() => tenantIncident.findAll({
        attributes: ['id', 'type', 'detected_class', 'status', 'createdAt', 'description'],
        order: [['createdAt', 'DESC']],
        limit: 10
      }), []),
      safeQuery(() => tenantUserReport.findAll({
        where: { createdAt: { [db.Sequelize.Op.gte]: fourteenDaysAgo } },
        attributes: ['id', 'status', 'createdAt', 'incident_type'],
        order: [['createdAt', 'DESC']],
        limit: 5000
      }), []),
      safeQuery(() => tenantUserReport.findAll({
        attributes: ['id', 'incident_type', 'status', 'createdAt', 'location_name'],
        order: [['createdAt', 'DESC']],
        limit: 10
      }), []),
      safeQuery(() => tenantZoneRiskScore.findAll({
        include: [{ model: tenantZone, as: 'zone', attributes: ['id', 'name'], required: false }],
        attributes: ['id', 'zone_id', 'risk_score', 'risk_factor', 'last_calculated'],
        order: [['risk_score', 'DESC']],
        limit: 20
      }), []),
      safeQuery(() => tenantCrowdMetric.findAll({
        where: { captured_at: { [db.Sequelize.Op.gte]: sevenDaysAgo } },
        attributes: ['id', 'camera_id', 'people_count', 'density_level', 'flow_direction', 'captured_at'],
        order: [['captured_at', 'DESC']],
        limit: 5000
      }), []),
      safeQuery(() => tenantCamera.count(), 0),
      safeQuery(() => tenantCamera.count({ where: { status: 'online' } }), 0),
      safeQuery(() => tenantPersonnel.count({ where: { role: 'responder', is_active: true } }), 0)
    ]);

    const classDistribution = buildClassDistribution(incidentRows);
    const heatmapMatrix = buildIncidentHeatmap(incidentRows);
    const lineSeries = buildLineSeries(incidentRows, userReportRows, crowdRows);

    const incidentPoints = incidentRows
      .map((item) => {
        const point = extractPoint(item.location);
        if (!point) return null;
        return {
          lat: point.lat,
          lng: point.lng,
          severity: item.status === 'new' ? 3 : item.status === 'assigned' ? 2 : 1,
          class: normalizeIncidentClass(item)
        };
      })
      .filter(Boolean)
      .slice(0, 300);

    const totalIncidents = incidentRows.length;
    const activeIncidents = incidentRows.filter((item) => ['new', 'assigned'].includes(item.status)).length;
    const resolvedIncidents = incidentRows.filter((item) => item.status === 'resolved').length;
    const falseAlarms = incidentRows.filter((item) => item.status === 'false_alarm').length;

    const totalReports = userReportRows.length;
    const newReports = userReportRows.filter((item) => item.status === 'new').length;
    const assignedReports = userReportRows.filter((item) => ['assigned', 'in_progress'].includes(item.status)).length;

    const averageRiskScore = zoneRiskRows.length
      ? Number((zoneRiskRows.reduce((sum, item) => sum + Number(item.risk_score || 0), 0) / zoneRiskRows.length).toFixed(1))
      : 0;

    const highRiskZones = zoneRiskRows.filter((item) => Number(item.risk_score || 0) >= 70).length;

    const crowdTotalPeople = crowdRows.reduce((sum, item) => sum + Number(item.people_count || 0), 0);
    const crowdAveragePeople = crowdRows.length ? Number((crowdTotalPeople / crowdRows.length).toFixed(1)) : 0;
    const crowdPeakPeople = crowdRows.reduce((max, item) => Math.max(max, Number(item.people_count || 0)), 0);

    return res.json({
      cards: {
        totalIncidents,
        activeIncidents,
        resolvedIncidents,
        falseAlarms,
        totalReports,
        newReports,
        assignedReports,
        cameraTotal,
        cameraActive,
        responderActive,
        averageRiskScore,
        highRiskZones,
        crowdAveragePeople,
        crowdPeakPeople
      },
      incidentsClasswise: classDistribution,
      lineSeries,
      pieSeries: classDistribution,
      heatmapMatrix,
      incidentHeatPoints: incidentPoints,
      riskZones: zoneRiskRows.map((item) => ({
        id: item.id,
        zone_id: item.zone_id,
        zone_name: item.zone?.name || 'Unknown zone',
        risk_score: Number(item.risk_score || 0),
        risk_factor: item.risk_factor || '-',
        last_calculated: item.last_calculated
      })),
      crowdMetrics: {
        averagePeople: crowdAveragePeople,
        peakPeople: crowdPeakPeople,
        totalSamples: crowdRows.length,
        flowBreakdown: {
          in: crowdRows.filter((item) => item.flow_direction === 'in').length,
          out: crowdRows.filter((item) => item.flow_direction === 'out').length,
          static: crowdRows.filter((item) => item.flow_direction === 'static').length,
          chaotic: crowdRows.filter((item) => item.flow_direction === 'chaotic').length
        },
        latest: crowdRows.slice(0, 20)
      },
      recentIncidents: recentIncidentRows,
      recentUserReports: recentUserReportRows
    });
  } catch (err) {
    return next(err);
  }
}