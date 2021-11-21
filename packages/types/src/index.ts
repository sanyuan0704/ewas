import { BuildOptions } from 'esbuild';
import { HTML } from './html';

export interface UserConfig extends BuildOptions {
  port?: number;
  startUrl?: string;
  html?: HTML;
}

export * from './html';
