// Public user (crowdsourcing) actions.
export async function reportIncident(req, res, next) {
  try {
    // TODO: persist manual incident with source "Manual" in tenant schema.
    return res.status(201).json({ message: 'Incident reported' });
  } catch (err) {
    return next(err);
  }
}
