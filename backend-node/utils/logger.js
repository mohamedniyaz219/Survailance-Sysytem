const log = (level, message, meta) => {
  const payload = meta ? { message, meta } : { message };
  // Simple logger; replace with Winston or pino if needed
  console[level](payload);
};

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
