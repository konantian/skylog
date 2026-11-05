const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");
const config = getDefaultConfig(__dirname);
// Share pure catalog modules with Next while keeping native React/Expo dependencies isolated.
config.watchFolders = [path.resolve(__dirname, "../..")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
module.exports = config;
