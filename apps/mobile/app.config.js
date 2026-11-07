// An OTA can target an already-installed iPhone binary after the displayed version advances.
module.exports = ({ config }) => {
  const runtimeVersion = process.env.SKYLOG_IOS_OTA_RUNTIME;
  if (!runtimeVersion) return config;
  return { ...config, ios: { ...config.ios, runtimeVersion } };
};
