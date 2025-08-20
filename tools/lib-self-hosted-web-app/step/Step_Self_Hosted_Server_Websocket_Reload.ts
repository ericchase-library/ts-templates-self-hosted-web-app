import { NodePlatform_Shell_StdIn_AddListener } from '../../../src/lib/ericchase/NodePlatform_Shell_StdIn.js';
import { Builder } from '../../core/Builder.js';
import { Logger } from '../../core/Logger.js';
import { SELF_HOSTED_SERVER_HOST } from './Step_Run_Self_Hosted_Server.js';

/** A `BeforeProcessingSteps` step for performing a websockets reload. */
export function Step_Self_Hosted_Server_Websocket_Reload(): Builder.Step {
  return new Class();
}
class Class implements Builder.Step {
  StepName = Step_Self_Hosted_Server_Websocket_Reload.name;
  channel = Logger(this.StepName).newChannel();

  reload_enabled = true;

  constructor() {}
  async onStartUp(): Promise<void> {
    NodePlatform_Shell_StdIn_AddListener((bytes, text) => {
      if (text === 'h') {
        this.reload_enabled = !this.reload_enabled;
        if (this.reload_enabled === true) {
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

    if (this.reload_enabled === true) {
      try {
        await fetch(`http://${SELF_HOSTED_SERVER_HOST}/api/websockets/reload`, { method: 'POST' });
      } catch (error) {
        this.channel.log(`Server not yet running.`);
      }
    }
  }
}
