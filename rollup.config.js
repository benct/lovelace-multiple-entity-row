import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import postCSS from 'rollup-plugin-postcss';
import postCSSLit from 'rollup-plugin-postcss-lit';
import postCSSPresetEnv from 'postcss-preset-env';
import inject from 'rollup-plugin-inject-process-env';

const dev = !!process.env.ROLLUP_WATCH;

const plugins = [
  resolve({ browser: true }),
  commonjs(),
  json(),
  inject(
    {
      DEBUG: dev,
      BUILD_TIME: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    { exclude: '**/*.css' },
  ),
  typescript({ sourceMap: dev, inlineSources: dev }),
  postCSS({
    plugins: [
      postCSSPresetEnv({
        stage: 1,
        features: {
          'nesting-rules': true,
          'custom-media-queries': true,
        },
      }),
    ],
    inject: true,
    extract: false,
  }),
  postCSSLit(),
];

export default [
  {
    input: 'src/multiple-entity-row.ts',
    output: {
      file: 'dist/multiple-entity-row.js',
      format: 'es',
      sourcemap: dev ? 'inline' : false,
      inlineDynamicImports: true,
    },
    plugins: dev ? plugins : [...plugins, terser({ format: { comments: false } })],
  },
];
