const path = require("path");
const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const packageJson = require("./package.json");
const srcDir = path.join(__dirname, "src");

function updateManifestVersionPlugin(compiler, callback) {
  const manifestPath = path.join(__dirname, 'public', 'manifest.json');

  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    if (manifest.version !== packageJson.version) {
      manifest.version = packageJson.version;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`Updated manifest.json version to ${packageJson.version}`);
    }
  } catch (error) {
    console.error('Error updating manifest.json:', error);
  }
  
  callback();
}

module.exports = {
  entry: {
    popup: path.join(srcDir, "popup.ts"),
    content_script: path.join(srcDir, "content-script.ts"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  optimization: {
    splitChunks: {
      name: "vendor",
      chunks(chunk) {
        return chunk.name !== "background";
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    // Custom plugin to update source manifest.json before copying
    {
      apply: (compiler) => {
        compiler.hooks.beforeRun.tapAsync(
          'UpdateManifestVersion',
          updateManifestVersionPlugin
        );
      }
    },
    new CopyPlugin({
      patterns: [{ from: "public" }],
      options: {},
    }),
  ],
};
