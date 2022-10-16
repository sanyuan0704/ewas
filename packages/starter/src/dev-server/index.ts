import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import chokidir from 'chokidar';
import { resolveConfig } from '../config';
import { createProxyMiddleware, Filter, Options, RequestHandler } from 'http-proxy-middleware';
import open from 'open';
import { buildOnServe, runBuildFirstTime } from '../build';
import { historyFallbackMiddware } from './middlewares/fallback';

export const ESBUILD_SERVE_PORT = 6789;
export const WS_PORT = 8888;

export const injectScript = `
<script type="text/javascript">
  if ('WebSocket' in window) {
    (function () {
        var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
        var address = protocol + '127.0.0.1:${WS_PORT}';
        var socket = new WebSocket(address);
        socket.onmessage = function (msg) {
            if (msg.data === 'reload') window.location.reload();
        };
        console.log('Live reload enabled.');
    })();
  }
</script>`;

export interface ServerOptions {
  root?: string;
}

export interface ResolvedConfig {
  root: string;
  port: number;
}

async function openBrowser(
  url: boolean | string | undefined,
  port: number
): Promise<void> {
  if (url === false) {
    return;
  }
  let startUrl;
  if (typeof url === 'string') {
    startUrl = !url.startsWith('http://') ? `http://${url}` : url;
  } else {
    startUrl = `http://127.0.0.1:${port}`;
  }
  await open(startUrl);
}

function initWebSocketServer(): {
  clients: WebSocket[];
  wsServer: WebSocketServer;
} {
  const clients: WebSocket[] = [];
  const wsServer = new WebSocketServer({ port: WS_PORT });
  wsServer.on('connection', (ws) => {
    clients.push(ws);

    ws.on('close', () => {
      const currentIndex = clients.findIndex((client) => client === ws);
      clients.splice(currentIndex, 1);
    });
  });
  return {
    clients,
    wsServer
  };
}

export async function createServer(options: ServerOptions) {
  const config = await resolveConfig();
  const { port = 9000, startUrl = true } = config;
  const devServer = express();

  // proxy to esbuild serve port
  devServer.use(
    '/static',
    createProxyMiddleware({
      target: 'http://localhost:6789',
      changeOrigin: true,
      pathRewrite: { '^/static': '' },
      logLevel: 'silent'
    })
  );

  devServer.use(historyFallbackMiddware(config));

  buildOnServe(config);

  devServer.listen(port, async () => {
    try {
      await runBuildFirstTime(config);
      openBrowser(startUrl, port);
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
  const { wsServer, clients } = initWebSocketServer();
  // page reload when application code changes
  chokidir
    .watch(`${process.cwd()}/src/**/*`, {
      interval: 0,
      ignoreInitial: true
    })
    .on('all', () => {
      clients.forEach((client) => client.send('reload'));
    });
}
