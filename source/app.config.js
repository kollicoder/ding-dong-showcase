module.exports = ({ config }) => process.env.DD_SANDBOX ? { ...config, experiments: { ...(config.experiments || {}), baseUrl: process.env.DD_BASE || '' } } : config;
