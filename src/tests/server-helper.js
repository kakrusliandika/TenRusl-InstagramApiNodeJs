import { createServer } from 'node:http';

const SAFE_PORT_START = 30_000;
const SAFE_PORT_SPAN = 20_000;
let startOffset = 0;

function candidatePort(attempt, offset) {
  return SAFE_PORT_START + ((process.pid + offset + attempt * 37) % SAFE_PORT_SPAN);
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

export async function startTestServer(listener) {
  const offset = startOffset;
  startOffset = (startOffset + 101) % SAFE_PORT_SPAN;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const server = typeof listener.address === 'function' && typeof listener.close === 'function'
      ? listener
      : createServer(listener);

    try {
      await listen(server, candidatePort(attempt, offset));
      const { port } = server.address();
      return { server, baseUrl: `http://127.0.0.1:${port}` };
    } catch (error) {
      if (!['EADDRINUSE', 'EACCES'].includes(error.code)) throw error;
    }
  }

  throw new Error('Unable to start test server on a safe local port.');
}
