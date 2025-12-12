const { Incident } = require('../models');
const response = require('../utils/responseHandler');

exports.list = async (req, res) => {
  try {
    const incidents = await Incident.findAll();
    return response.success(res, incidents);
  } catch (err) {
    console.error(err);
    return response.error(res, 'Failed to fetch incidents');
  }
};

exports.create = async (req, res) => {
  try {
    const incident = await Incident.create(req.body);
    return response.success(res, incident, 201);
  } catch (err) {
    console.error(err);
    return response.error(res, 'Failed to create incident');
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Incident.update(req.body, { where: { id } });
    if (!updated) return response.error(res, 'Incident not found', 404);
    const incident = await Incident.findByPk(id);
    return response.success(res, incident);
  } catch (err) {
    console.error(err);
    return response.error(res, 'Failed to update incident');
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Incident.destroy({ where: { id } });
    if (!deleted) return response.error(res, 'Incident not found', 404);
    return response.success(res, { id });
  } catch (err) {
    console.error(err);
    return response.error(res, 'Failed to delete incident');
  }
};
