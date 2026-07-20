import * as crypto from 'crypto';
export class SecurityGate {
  async verify(command: any): Promise<boolean> {
    if (!command.signature) return false;
    const computed = crypto
      .createHmac('sha256', process.env.EDGE_SHARED_SECRET || 'local-dev-secret')
      .update(JSON.stringify(command.payload))
      .digest('hex');
    return computed === command.signature;
  }
}
