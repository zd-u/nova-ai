const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const finalConfig = withNativeWind(config, {
  input: "./global.css",
  // NOTE: forceWriteFileSystem was removed. It made react-native-css-interop
  // write a `node_modules/react-native-css-interop/.cache/web.css` file mid-build,
  // which Metro's file watcher raced to hash and crashed `expo export --platform web`
  // with "Failed to get the SHA-1 for .../.cache/web.css". Web production export
  // emits CSS via nativewind's serializer without it, so this is safe to drop.
});

// Exclude react-native-css-interop's generated cache from Metro's haste map.
// Without this, `npx expo export --platform web` fails with
// "Failed to get the SHA-1 for .../react-native-css-interop/.cache/web.css"
// (a race between css-interop writing the file and Metro hashing it mid-build).
// IMPORTANT: must be applied AFTER withNativeWind(), which resets resolver options.
finalConfig.resolver.blockList = [
  ...(finalConfig.resolver.blockList || []),
  /node_modules[\\/]react-native-css-interop[\\/]\.cache[\\/]/,
];

module.exports = finalConfig;
