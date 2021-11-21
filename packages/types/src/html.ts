export type ScriptType = 'blocking' | 'defer' | 'module';

export interface HTML {
  crossorigin?: undefined | boolean | string;
  template?: string;
  templateContent?: string;
  publicPath?: string;
  filename?: string | ((entry: string) => string);
  scriptLoading?: ScriptType;
}
