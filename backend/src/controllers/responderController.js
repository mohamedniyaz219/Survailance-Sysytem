// Responder (official app) actions.
export async function getMyAlerts(req, res, next) {
  try {
    // TODO: fetch incidents for the responder's zone within tenant schema.
    return res.json({ alerts: [] });
  } catch (err) {
    return next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    // TODO: update incident status with validation of allowed transitions.
    return res.json({ id, status });
  } catch (err) {
    return next(err);
  }
}

export async function getNavigation(req, res, next) {
  try {
    const { id } = req.params;
    // TODO: return coordinates/directions for the incident.
    return res.json({ id, coordinates: null });
  } catch (err) {
    return next(err);
  }
}
