import path from 'path';
import fs from 'fs';
import { build, BuildOptions, Loader } from 'esbuild';
import { isBuild } from './utils';
import deepmerge from 'deepmerge';
import { UserConfig } from '@ewas/types';

const RESOURCE_LOADER = ['.png', '.jpeg', '.jpg', '.svg', '.woff'];

const genLoader = (): Record<string, string> =>
  RESOURCE_LOADER.reduce((pre: Record<string, string>, cur: string) => {
    pre[cur] = 'file';
    return pre;
  }, {} as Record<string, string>);

const defaultOptions: BuildOptions = {
  bundle: true,
  color: true,
  define: {},
  publicPath: '/static',
  format: 'esm',
  entryPoints: [],
  sourcemap: true,
  incremental: true,
  splitting: true,
  minify: isBuild,
  outdir: 'build',
  metafile: true,
  absWorkingDir: process.cwd(),
  write: true,
  loader: genLoader() as Record<string, Loader>,
  plugins: []
};

async function loadConfigFromBundledFile(
  fileName: string,
  bundledCode: string
) {
  const extension = path.extname(fileName);
  const defaultLoader = require.extensions[extension]!;
  require.extensions[extension] = (module: NodeModule, filename: string) => {
    if (filename === fileName) {
      (module as any)._compile(bundledCode, filename);
    } else {
      defaultLoader(module, filename);
    }
  };
  delete require.cache[require.resolve(fileName)];
  const raw = require(fileName);
  const config = raw.__esModule ? raw.default : raw;
  require.extensions[extension] = defaultLoader;
  return config;
}

async function bundleConfigFile(configFilePath: string, isESM = false) {
  const result = await build({
    format: isESM ? 'esm' : 'cjs',
    bundle: true,
    write: false,
    platform: 'node',
    sourcemap: 'inline',
    metafile: true,
    absWorkingDir: process.cwd(),
    entryPoints: [configFilePath]
  });
  return result.outputFiles[0];
}

export async function loadConfigFromFile(): Promise<UserConfig | void> {
  const configFiles = ['esbuild.config.ts', 'esbuild.config.js'];
  const cwd = process.cwd();
  let userConfig;

  for (const configFile of configFiles) {
    const configFilePath = path.join(cwd, configFile);
    if (fs.existsSync(configFilePath)) {
      const bundled = await bundleConfigFile(configFilePath);
      userConfig = loadConfigFromBundledFile(configFilePath, bundled.text);
      return userConfig;
    }
  }
}

export async function resolveConfig(): Promise<UserConfig> {
  const config = await loadConfigFromFile();
  return deepmerge(defaultOptions, config || {});
}
