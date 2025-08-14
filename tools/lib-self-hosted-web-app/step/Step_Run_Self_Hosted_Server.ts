import { Subprocess } from 'bun';
import { Core_Promise_Orphan } from '../../../src/lib/ericchase/Core_Promise_Orphan.js';
import { Async_Core_Stream_Uint8_Read_Lines } from '../../../src/lib/ericchase/Core_Stream_Uint8_Read_Lines.js';
import { Builder } from '../../core/Builder.js';
import { Logger } from '../../core/Logger.js';

/** An `AfterProcessingSteps` step for running the server. */
export function Step_Run_Self_Hosted_Server(config: Config): Builder.Step {
  return new Class(config);
}
class Class implements Builder.Step {
  StepName = Step_Run_Self_Hosted_Server.name;
  channel = Logger(this.StepName).newChannel();

  process_server?: Subprocess<'ignore', 'pipe', 'pipe'>;
  async async_killServer() {
    if (this.process_server !== undefined) {
      this.process_server.kill();
      await this.process_server.exited;
    }
  }

  constructor(readonly config: Config) {}

  async onRun(): Promise<void> {
    if (Builder.GetMode() !== Builder.MODE.DEV) return;

    await this.async_killServer();

    const p0 = Bun.spawn(['bun', 'run', './server.module.js'], {
      cwd: Builder.Dir.Out,
      env: { ...process.env },
      stderr: 'pipe',
      stdout: 'pipe',
    });
    const [stdout, stdout_tee] = p0.stdout.tee();
    await Async_Core_Stream_Uint8_Read_Lines(stdout_tee, (line) => {
      if (line.startsWith('Serving at')) {
        return false;
      }
    });
    Core_Promise_Orphan(Async_Core_Stream_Uint8_Read_Lines(p0.stderr, (line) => this.channel.error(line)));
    Core_Promise_Orphan(Async_Core_Stream_Uint8_Read_Lines(stdout, (line) => this.channel.log(line)));
    this.process_server = p0;
  }
  async onCleanUp(): Promise<void> {
    await this.async_killServer();
  }
}
interface Config {
  /** The host string for main server. i.e.: `54321`. */
  server_port: number;
}
