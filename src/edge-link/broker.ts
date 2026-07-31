import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { CommandRouter } from './command-router.js';
import { SecurityGate } from './security-gate.js';
import { MemoryLogger } from './memory-logger.js';
export class EdgeBroker {
  private wss: WebSocketServer;
  private router = new CommandRouter();
  private security = new SecurityGate();
  private logger = new MemoryLogger();
  constructor(port: number = 8080) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws) => {
      console.log('[EdgeLink] Device connected.');
      ws.on('message', async (data) => {
        try {
          const command = JSON.parse(data.toString());
          const valid = await this.security.verify(command);
          if (!valid) { ws.send(JSON.stringify({ error: 'Unauthorized' })); return; }
          const result = await this.router.route(command);
          this.logger.logCommand(command, result);
          ws.send(JSON.stringify({ ...result, commandId: command.id }));
        } catch (e: any) {
          ws.send(JSON.stringify({ error: e.message }));
        }
      });
    });
    server.listen(port, () => {
      console.log(`🚀 Edge-Link Broker listening on port ${port}`);
    });
  }
}
