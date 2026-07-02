const webpack = require('webpack');
const path = require('path');
const { execSync } = require('child_process');

// Baked into the console banner so a running instance can be identified as a specific build -
// e.g. to tell a stale cached bundle apart from a freshly rebuilt one during local/HA testbed
// development. Not meaningful for build reproducibility (a rebuild of the same commit produces
// different bytes), which is fine here: the built file isn't a tracked/diffed artifact.
const buildTime = new Date().toISOString();
let buildCommit = 'unknown';
try {
    buildCommit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (_err) {
    // Not in a git checkout (e.g. a downloaded source tarball) - leave as 'unknown'.
}

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, 'src', 'index.js'),
    output: {
        filename: 'multiple-entity-row.js',
        path: path.resolve(__dirname),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            'process.env.BUILD_TIME': JSON.stringify(buildTime),
            'process.env.BUILD_COMMIT': JSON.stringify(buildCommit),
        }),
    ],
};
