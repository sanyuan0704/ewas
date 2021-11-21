export class HTMLBuilder {
  private _html: string;
  constructor(raw = '') {
    this._html = raw;
  }
  // Replacement by string is 10x faster than regexp.
  prependHead(content = ''): HTMLBuilder {
    // regexp: str.replace(/)
    const HEAD_OPEN_TAG = '<head>';
    if (this._html.includes(HEAD_OPEN_TAG)) {
      this._html = this._html.replace(
        HEAD_OPEN_TAG,
        `${HEAD_OPEN_TAG}${content}`
      );
    } else {
      // support <head attr="xxx">
      this._html = this._html.replace(/(<head\s*[\d\D]*?>)/, `$1${content}`);
    }
    return this;
  }
  appendHead(content = ''): HTMLBuilder {
    this._html = this._html.replace('</head>', `${content}</head>`);
    return this;
  }
  appendBody(content = ''): HTMLBuilder {
    this._html = this._html.replace('</body>', `${content}</body>`);
    return this;
  }
  appendBodyEnd(content = ''): HTMLBuilder {
    this._html = this._html.replace('</body>', `</body>${content}`);
    return this;
  }
  finish(): string {
    return this._html;
  }
}
