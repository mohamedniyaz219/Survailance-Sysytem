import db from '../models/index.js';
import { spawnTranscoder } from '../services/videoService.js';
const { Camera } = db;

export async function getCameras(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const cameras = await Camera.findAll({ schema });
    res.json(cameras);
  } catch (err) {
    next(err);
  }
}

export async function startStream(req, res, next) {
  try {
    const { id } = req.params;
    const schema = req.tenantSchema;

    const camera = await Camera.findOne({ where: { id }, schema });
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    // This service function handles the FFmpeg process
    // Returns the HLS URL (e.g., /hls/cam_1/index.m3u8)
    const streamUrl = await spawnTranscoder(camera.rtsp_url, camera.id);

    res.json({ streamUrl });
  } catch (err) {
    next(err);
  }
}