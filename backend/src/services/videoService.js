const ffmpeg = require('fluent-ffmpeg');

/**
 * Video Service
 * Handles FFmpeg stream conversion and processing
 */
class VideoService {
  constructor() {
    this.activeStreams = new Map();
  }

  /**
   * Convert RTSP stream to HLS for web playback
   */
  convertStreamToHLS(streamUrl, outputPath) {
    return new Promise((resolve, reject) => {
      const stream = ffmpeg(streamUrl)
        .outputOptions([
          '-hls_time 2',
          '-hls_list_size 3',
          '-hls_flags delete_segments',
          '-f hls'
        ])
        .output(outputPath)
        .on('start', () => {
          console.log('Stream conversion started');
          resolve(stream);
        })
        .on('error', (err) => {
          console.error('Stream conversion error:', err);
          reject(err);
        });

      stream.run();
    });
  }

  /**
   * Extract frame from video stream for AI processing
   */
  extractFrame(streamUrl) {
    return new Promise((resolve, reject) => {
      ffmpeg(streamUrl)
        .screenshots({
          count: 1,
          folder: '/tmp',
          filename: 'frame-%s.jpg'
        })
        .on('end', (filenames) => {
          resolve(filenames);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  stopStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.kill();
      this.activeStreams.delete(streamId);
    }
  }
}

module.exports = new VideoService();
