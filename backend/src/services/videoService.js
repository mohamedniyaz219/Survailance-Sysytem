import { spawn } from 'child_process';

// Placeholder for spawning FFmpeg to convert RTSP to HLS/DASH/etc.
export function spawnTranscoder(rtspUrl, outputDir) {
  if (!rtspUrl || !outputDir) {
    throw new Error('rtspUrl and outputDir are required');
  }

  // Example command; adjust flags/paths as needed for production.
  const args = [
    '-i', rtspUrl,
    '-c:v', 'copy',
    '-f', 'hls',
    `${outputDir}/index.m3u8`,
  ];

  const proc = spawn('ffmpeg', args, { stdio: 'ignore' });
  return proc;
}
