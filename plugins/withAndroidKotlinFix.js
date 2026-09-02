const { withProjectBuildGradle } = require('@expo/config-plugins');

const withAndroidKotlinFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      
      const fixSnippet = `
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            freeCompilerArgs += [
                "-Xskip-metadata-version-check",
                "-Xskip-prerelease-check"
            ]
        }
    }
    configurations.all {
        resolutionStrategy {
            force 'com.google.android.gms:play-services-ads:23.6.0'
        }
    }
}
`;
      if (!contents.includes('-Xskip-metadata-version-check')) {
        contents += fixSnippet;
      }
      config.modResults.contents = contents;
    }
    return config;
  });
};

module.exports = withAndroidKotlinFix;
