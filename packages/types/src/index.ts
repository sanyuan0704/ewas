import { BuildOptions } from 'esbuild';
import { HTML } from './html';

export interface UserConfig {
  port?: number;
  startUrl?: string;
  html?: HTML;
  esbuildOptions?: BuildOptions;
}

export * from './html';
