// plugins/withSimdjson.js
// Ensures WatermelonDB's simdjson dependency is declared in the Podfile
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withSimdjson(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      // Add simdjson pod declaration if not already present
      if (!podfile.includes("pod 'simdjson'")) {
        podfile = podfile.replace(
          "use_expo_modules!",
          "use_expo_modules!\n\n  # WatermelonDB requires simdjson — vendored via @nozbe/simdjson\n  pod 'simdjson', :path => '../node_modules/@nozbe/simdjson'"
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
}

module.exports = withSimdjson;
