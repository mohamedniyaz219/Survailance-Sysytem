// Admin (dashboard) actions.
export async function addCamera(req, res, next) {
  try {
    // TODO: persist RTSP URL and location into tenant-specific Cameras table.
    return res.status(201).json({ message: 'Camera created' });
  } catch (err) {
    return next(err);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    // TODO: aggregate incident counts per type/status for the tenant.
    return res.json({ data: [] });
  } catch (err) {
    return next(err);
  }
}

export async function manageOfficials(req, res, next) {
  try {
    if (req.method === 'DELETE') {
      // TODO: delete official by id scoped to tenant.
      return res.json({ message: 'Official removed' });
    }
    // TODO: create official scoped to tenant.
    return res.status(201).json({ message: 'Official created' });
  } catch (err) {
    return next(err);
  }
}

export async function liveFeed(req, res, next) {
  try {
    const { cameraId } = req.params;
    // TODO: resolve HLS URL for the given camera within tenant schema.
    return res.json({ cameraId, hls: null });
  } catch (err) {
    return next(err);
  }
}
