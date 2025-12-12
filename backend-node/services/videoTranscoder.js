const ffmpeg = require('fluent-ffmpeg');

exports.toHLS = (rtspUrl, outputPath) => {
  return new Promise((resolve, reject) => {
    const task = ffmpeg(rtspUrl)
      .addOptions(['-hls_time 2', '-hls_list_size 4', '-hls_flags delete_segments'])
      .output(outputPath)
      .on('start', () => resolve(task))
      .on('error', (err) => reject(err));

    task.run();
  });
};
