import { globalEventBus } from '../events/EventBus.js';
import { globalStateManager } from '../state/StateManager.js';

export interface KernelCommand {
  name: string;
  sender: string;
  payload: any;
  timestamp: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export type CommandHandler = (cmd: KernelCommand) => Promise<CommandResult>;

export class CommandDispatcher {
  private handlers: Map<string, CommandHandler> = new Map();

  public registerHandler(commandName: string, handler: CommandHandler): void {
    if (this.handlers.has(commandName)) {
      throw new Error(`Command handler for "${commandName}" already registered.`);
    }
    this.handlers.set(commandName, handler);
  }

  public async dispatch(commandName: string, sender: string, payload: any): Promise<CommandResult> {
    const cmd: KernelCommand = {
      name: commandName,
      sender,
      payload,
      timestamp: new Date().toISOString()
    };

    // 1. Logging incoming command
    globalEventBus.publish('CommandReceived', { commandName, sender, timestamp: cmd.timestamp });

    // 2. Validation / Handler existence
    const handler = this.handlers.get(commandName);
    if (!handler) {
      const errMsg = `Command handler for "${commandName}" not found in Command Dispatcher.`;
      globalEventBus.publish('CommandFailed', { commandName, sender, error: errMsg });
      return { success: false, message: errMsg, error: errMsg };
    }

    // 3. Authorization (Placeholder for security model check)
    globalEventBus.publish('CommandAuthorized', { commandName, sender });

    try {
      // 4. Execution
      const result = await handler(cmd);
      
      // 5. Verification & Log outcomes
      if (result.success) {
        globalEventBus.publish('CommandExecuted', { commandName, sender, result });
      } else {
        globalEventBus.publish('CommandFailed', { commandName, sender, error: result.error || result.message });
      }

      return result;
    } catch (e) {
      const err = e as Error;
      globalEventBus.publish('CommandFailed', { commandName, sender, error: err.message });
      return { success: false, message: `System error during execution: ${err.message}`, error: err.message };
    }
  }
}

export const globalCommandDispatcher = new CommandDispatcher();
