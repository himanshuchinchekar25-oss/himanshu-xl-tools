/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const urlDev = "https://localhost:3000/";
const urlProd =
  "https://restless-shape-bea9.himanshuchinchekar25.workers.dev/";

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();

  return {
    ca: httpsOptions.ca,
    key: httpsOptions.key,
    cert: httpsOptions.cert,
  };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";

  const config = {
    devtool: "source-map",

    entry: {
      polyfill: [
        "core-js/stable",
        "regenerator-runtime/runtime",
      ],

      taskpane: "./src/taskpane/taskpane.js",

      commands: "./src/commands/commands.js",

      mergeFiles: "./src/merge-files/merge-files.js",

      splitWorkbook:"./src/split-workbook/split-workbook.js",

        exportPdf:"./src/export-pdf/export-pdf.js",

        exportPpt:"./src/export-ppt/export-ppt.js",

        batchRename:"./src/batch-rename/batch-rename.js",

        hideUnhideSheets:"./src/hide-unhide-sheets/hide-unhide-sheets.js",

        protectSheet:"./src/protect-sheet/protect-sheet.js",
        
        renameSheets:"./src/rename-sheets/rename-sheets.js",

        copyMoveSheet:"./src/copy-move-sheet/copy-move-sheet.js",

        quickClean: "./src/quick-clean/quick-clean.js",

        fillBlanks: "./src/fill-blanks/fill-blanks.js",

        formulaTools: "./src/formula-tools/formula-tools.js",
        autoRefresh: "./src/auto-refresh/auto-refresh.js",
        aiFormula: "./src/ai-formula/ai-formula.js",
        explainFormula: "./src/explain-formula/explain-formula.js",
        fixFormula: "./src/fix-formula/fix-formula.js",
        aiAnalysis: "./src/ai-analysis/ai-analysis.js",
        powerDashboard:"./src/power-dashboard/power-dashboard.js",
        dashboardView:"./src/dashboard-view/dashboard-view.js",
        adminControlCenter:"./src/admin-control-center/admin-control-center.js",
        website:"./src/website/website.js",
        customerPortal:"./src/customer-portal/customer-portal.js",
    },

    output: {
      clean: true,
    },

    resolve: {
      extensions: [".html", ".js"],
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },

        {
  test: /\.html$/,
  exclude: /node_modules/,
  use: {
    loader: "html-loader",
    options: {
      minimize: false,
    },
  },
},

        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane"],
      }),

      new HtmlWebpackPlugin({
        filename: "merge-files.html",
        template: "./src/merge-files/merge-files.html",
        chunks: ["polyfill", "mergeFiles"],
      }),

      new HtmlWebpackPlugin({
  filename: "split-workbook.html",
  template: "./src/split-workbook/split-workbook.html",
  chunks: ["polyfill", "splitWorkbook"],
  minify: false,
}),

      new HtmlWebpackPlugin({
  filename: "export-pdf.html",
  template: "./src/export-pdf/export-pdf.html",
  chunks: ["polyfill", "exportPdf"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename:
    "export-ppt.html",

  template:
    "./src/export-ppt/export-ppt.html",

  chunks: [
    "polyfill",
    "exportPpt"
  ],

  minify:
    false,
}),

  new HtmlWebpackPlugin({
  filename: "batch-rename.html",
  template: "./src/batch-rename/batch-rename.html",
  chunks: ["polyfill", "batchRename"],
  minify: false,
}),

    new HtmlWebpackPlugin({
  filename: "hide-unhide-sheets.html",
  template:
    "./src/hide-unhide-sheets/hide-unhide-sheets.html",
  chunks: [
    "polyfill",
    "hideUnhideSheets"
  ],
  minify: false,
}),

      new HtmlWebpackPlugin({
  filename: "protect-sheet.html",
  template: "./src/protect-sheet/protect-sheet.html",
  chunks: ["polyfill", "protectSheet"],
  minify: false,
}),


    new HtmlWebpackPlugin({
  filename: "rename-sheets.html",
  template: "./src/rename-sheets/rename-sheets.html",
  chunks: ["polyfill", "renameSheets"],
  minify: false,
}),


new HtmlWebpackPlugin({
  filename: "copy-move-sheet.html",
  template: "./src/copy-move-sheet/copy-move-sheet.html",
  chunks: ["polyfill", "copyMoveSheet"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "quick-clean.html",
  template: "./src/quick-clean/quick-clean.html",
  chunks: ["polyfill", "quickClean"],
  minify: false,
}),

      new HtmlWebpackPlugin({
  filename: "fill-blanks.html",
  template: "./src/fill-blanks/fill-blanks.html",
  chunks: ["polyfill", "fillBlanks"],
  minify: false,
}),

      new HtmlWebpackPlugin({
  filename: "formula-tools.html",
  template: "./src/formula-tools/formula-tools.html",
  chunks: ["polyfill", "formulaTools"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "auto-refresh.html",
  template: "./src/auto-refresh/auto-refresh.html",
  chunks: ["polyfill", "autoRefresh"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "ai-formula.html",
  template: "./src/ai-formula/ai-formula.html",
  chunks: ["polyfill", "aiFormula"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "explain-formula.html",
  template: "./src/explain-formula/explain-formula.html",
  chunks: ["polyfill", "explainFormula"],
  minify: false,
}),

    new HtmlWebpackPlugin({
  filename: "fix-formula.html",
  template: "./src/fix-formula/fix-formula.html",
  chunks: ["polyfill", "fixFormula"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "ai-analysis.html",
  template: "./src/ai-analysis/ai-analysis.html",
  chunks: ["polyfill", "aiAnalysis"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "power-dashboard.html",
  template:
    "./src/power-dashboard/power-dashboard.html",
  chunks: [
    "polyfill",
    "powerDashboard"
  ],
  minify: false,
}),


new HtmlWebpackPlugin({
  filename: "dashboard-view.html",
  template:
    "./src/dashboard-view/dashboard-view.html",
  chunks: [
    "polyfill",
    "dashboardView"
  ],
  minify: false,
}),


new HtmlWebpackPlugin({
  filename: "index.html",
  template: "./src/website/website.html",
  chunks: ["polyfill", "website"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "customer-portal.html",
  template: "./src/customer-portal/customer-portal.html",
  chunks: ["polyfill", "customerPortal"],
  minify: false,
}),

new HtmlWebpackPlugin({
  filename: "admin-control-center.html",
  template:
    "./src/admin-control-center/admin-control-center.html",
  chunks: [
    "polyfill",
    "adminControlCenter"
  ],
  minify: false,
}),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets",
            to: "assets",
          },

          {
    from:
        "src/export-ppt/vendor/pptxgen.bundle.js",

    to:
        "vendor/pptxgen.bundle.js",
},

          {
          from: "src/public-pages/privacy.html",
          to: "privacy.html",
        },
        {
          from: "src/public-pages/terms.html",
          to: "terms.html",
        },
        {
          from: "src/public-pages/support.html",
          to: "support.html",
        },
        {
  from: "manifest.xml",
  to: "manifest.xml",

  transform(content) {
    if (dev) {
      return content;
    }

    return content
      .toString()
      .replace(
        new RegExp(urlDev, "g"),
        urlProd
      );
  },
},
        ],
      }),

      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
    ],

    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },

      server: {
        type: "https",

        options:
          env.WEBPACK_BUILD ||
          options.https !== undefined
            ? options.https
            : await getHttpsOptions(),
      },

      port:
        process.env
          .npm_package_config_dev_server_port ||
        3000,
    },
  };

  return config;
};

