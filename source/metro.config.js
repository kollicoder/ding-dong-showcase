const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
if (process.env.DD_SANDBOX) {
  const MOCK = '/workspace/showcase/sandbox/firebase-mock.js';
  config.watchFolders = [...(config.watchFolders || []), '/workspace/showcase/sandbox'];
  const orig = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (ctx, name, platform) => {
    if (/^firebase\/(app|auth|firestore)$/.test(name)) return { type: 'sourceFile', filePath: MOCK };
    return orig ? orig(ctx, name, platform) : ctx.resolveRequest(ctx, name, platform);
  };
}
module.exports = config;
