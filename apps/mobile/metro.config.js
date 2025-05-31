const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

// Function to generate resolver config for a package
function createPackageResolverConfig(packageDirectoryName, monorepoRootDir) {
  const packageRootPath = path.resolve(
    monorepoRootDir,
    "packages",
    packageDirectoryName
  );
  const packageJsonPath = path.join(packageRootPath, "package.json");

  try {
    const packageJsonFile = fs.readFileSync(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonFile);
    const packageName = packageJson.name; // Actual package name from package.json
    const exports = packageJson.exports;

    const mappings = {};
    if (exports) {
      for (const key in exports) {
        if (Object.prototype.hasOwnProperty.call(exports, key)) {
          const exportEntry = exports[key];
          const targetFile =
            typeof exportEntry === "string"
              ? exportEntry
              : exportEntry.import || exportEntry.require;

          if (targetFile && typeof targetFile === "string") {
            const mappingKey =
              key === "." ? packageName : `${packageName}/${key.substring(2)}`;
            const mappingValue = targetFile.startsWith("./")
              ? targetFile.substring(2)
              : targetFile;
            mappings[mappingKey] = mappingValue;
          }
        }
      }
    }
    return { packageName, packageRootPath, mappings };
  } catch (error) {
    console.error(
      `Error processing package.json for ${packageDirectoryName}:`,
      error
    );
    return null;
  }
}

const packageResolverConfigs = [
  createPackageResolverConfig("api-client", monorepoRoot),
].filter((config) => config !== null);

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Custom resolver using the generated configs
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const pkgConfig of packageResolverConfigs) {
    if (pkgConfig.mappings && pkgConfig.mappings[moduleName]) {
      const filePath = path.join(
        pkgConfig.packageRootPath,
        pkgConfig.mappings[moduleName]
      );
      return {
        filePath: filePath,
        type: "sourceFile",
      };
    }
  }

  // If no custom resolution, fall back to default
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
