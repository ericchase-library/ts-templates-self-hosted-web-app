import { NodePlatform_Shell_StdIn_AddListener } from '../../../src/lib/ericchase/NodePlatform_Shell_StdIn.js';
import { Builder } from '../../core/Builder.js';
import { Logger } from '../../core/Logger.js';

/** A `BeforeProcessingSteps` step for performing a websockets reload. */
export function Step_Self_Hosted_Server_Websocket_Reload(config: Config): Builder.Step {
  return new Class(config);
}
class Class implements Builder.Step {
  StepName = Step_Self_Hosted_Server_Websocket_Reload.name;
  channel = Logger(this.StepName).newChannel();

  hotreload_enabled = true;

  constructor(readonly config: Config) {}

  async onStartUp(): Promise<void> {
    NodePlatform_Shell_StdIn_AddListener((bytes, text) => {
      if (text === 'h') {
        this.hotreload_enabled = !this.hotreload_enabled;
        if (this.hotreload_enabled === true) {
          this.channel.log("Hot Refresh On    (Press 'h' to toggle.)");
        } else {
          this.channel.log("Hot Refresh Off   (Press 'h' to toggle.)");
        }
      }
    });
    this.channel.log("Hot Refresh On    (Press 'h' to toggle.)");
  }
  async onRun(): Promise<void> {
    if (Builder.GetMode() !== Builder.MODE.DEV) return;

    if (this.hotreload_enabled === true) {
      try {
        await fetch(`http://127.0.0.1:${this.config.server_port}/websockets/reload`, { method: 'POST' });
      } catch (error) {
        this.channel.log(`Server on port ${this.config.server_port} not yet running.`);
      }
    }
  }
}
interface Config {
  /** The host string for main server. i.e.: `54321`. */
  server_port: number;
}
