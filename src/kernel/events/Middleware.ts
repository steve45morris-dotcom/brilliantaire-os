import { KernelEvent } from './EventBus.js';

export type EventMiddlewareFn = (event: KernelEvent, next: () => void) => void;

export class EventMiddlewareChain {
  private middlewares: EventMiddlewareFn[] = [];

  public use(fn: EventMiddlewareFn): void {
    this.middlewares.push(fn);
  }

  public execute(event: KernelEvent, target: (event: KernelEvent) => void): void {
    let index = 0;
    const next = () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        try {
          middleware(event, next);
        } catch (err) {
          console.error(`Middleware execution error: ${err}`);
        }
      } else {
        target(event);
      }
    };
    next();
  }
}
