const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const sveltePreprocess = require("svelte-preprocess");
const srcDir = path.join(__dirname, "src");

module.exports = {
  entry: {
    popup: path.join(srcDir, "popup.ts"),
    // calendars: path.join(srcDir, "calendars.ts"),
    calendars: path.join(srcDir, "welcome", "calendars.ts"),
    background: path.join(srcDir, "background.ts"),
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
      {
        test: /\.(html|svelte)$/,
        use: {
          loader: "svelte-loader",
          options: {
            preprocess: sveltePreprocess(),
          },
        },
      },
      {
        // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    alias: {
      svelte: path.resolve("node_modules", "svelte/src/runtime"),
    },
    extensions: [".mjs", ".svelte", ".ts", ".tsx", ".js"],
    mainFields: ["svelte", "browser", "module", "main"],
    conditionNames: ["svelte", "browser", "import"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "public" }],
      options: {},
    }),
  ],
};
