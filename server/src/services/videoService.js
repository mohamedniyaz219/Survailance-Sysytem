import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';

const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';
const HLS_ROOT = path.resolve(process.cwd(), 'hls');
const activeTranscoders = new Map();

function ensureFfmpegInstalled() {
  const check = spawnSync(FFMPEG_BIN, ['-version'], { stdio: 'ignore' });
  if (check.status === 0) return;

  const error = new Error('ffmpeg is not installed or not available in PATH');
  error.code = 'FFMPEG_MISSING';
  throw error;
}

// Spawns FFmpeg to convert RTSP to HLS and returns the HLS playlist URL.
export function spawnTranscoder(rtspUrl, cameraId) {
  if (!rtspUrl || !cameraId) {
    throw new Error('rtspUrl and cameraId are required');
  }

  ensureFfmpegInstalled();

  const streamKey = `cam_${cameraId}`;
  const streamDir = path.join(HLS_ROOT, streamKey);
  const outputPlaylist = path.join(streamDir, 'index.m3u8');
  const publicUrl = `/hls/${streamKey}/index.m3u8`;

  fs.mkdirSync(streamDir, { recursive: true });

  const existingProcess = activeTranscoders.get(streamKey);
  if (existingProcess && !existingProcess.killed) {
    return publicUrl;
  }

  const args = [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-c:v', 'copy',
    '-an',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments+append_list',
    outputPlaylist
  ];

  const proc = spawn(FFMPEG_BIN, args, {
    stdio: ['ignore', 'ignore', 'pipe']
  });

  proc.on('error', (err) => {
    console.error(`FFmpeg process error for ${streamKey}:`, err.message);
    activeTranscoders.delete(streamKey);
  });

  proc.on('close', () => {
    activeTranscoders.delete(streamKey);
  });

  activeTranscoders.set(streamKey, proc);
  return publicUrl;
}
