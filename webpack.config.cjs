const path = require("path");
const fs = require("fs");
const packageJson = require("./package.json");
const srcDir = path.join(__dirname, "src");
const publicDir = path.join(__dirname, "public");

function removeNonWebpackOutput(destDir, compilation) {
  const webpackAssets = new Set(
    compilation.getAssets().map((asset) => asset.name.replace(/\\/g, "/"))
  );

  function walk(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        if (fs.readdirSync(full).length === 0) {
          fs.rmdirSync(full);
        }
        continue;
      }

      const rel = path.relative(destDir, full).replace(/\\/g, "/");
      if (!webpackAssets.has(rel)) {
        fs.unlinkSync(full);
      }
    }
  }

  walk(destDir);
}

function copyPublicPlugin() {
  return {
    apply(compiler) {
      compiler.hooks.afterCompile.tap("CopyPublic", (compilation) => {
        compilation.contextDependencies.add(publicDir);
      });

      compiler.hooks.afterEmit.tap("CopyPublic", (compilation) => {
        const manifestPath = path.join(publicDir, "manifest.json");

        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

          if (manifest.version !== packageJson.version) {
            manifest.version = packageJson.version;
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            console.log(
              `Updated manifest.json version to ${packageJson.version}`
            );
          }
        } catch (error) {
          console.error("Error updating manifest.json:", error);
        }

        const destDir = compilation.options.output.path;
        removeNonWebpackOutput(destDir, compilation);
        fs.cpSync(publicDir, destDir, { recursive: true });
      });
    },
  };
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
  experiments: {
    typescript: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [copyPublicPlugin()],
};
