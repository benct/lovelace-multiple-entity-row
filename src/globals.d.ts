// Build-time constants injected by webpack DefinePlugin (see webpack.config.js).
declare const process: {
    env: {
        NODE_ENV: string;
        BUILD_TIME: string;
        BUILD_COMMIT: string;
        PACKAGE_VERSION: string;
    };
};
