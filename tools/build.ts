import { BunPlatform_Argv_Includes } from '../src/lib/ericchase/BunPlatform_Argv_Includes.js';
import { Step_Dev_Format } from './core-dev/step/Step_Dev_Format.js';
import { Step_Dev_Project_Update_Config } from './core-dev/step/Step_Dev_Project_Update_Config.js';
import { Processor_HTML_Custom_Component_Processor } from './core-web/processor/Processor_HTML_Custom_Component_Processor.js';
import { Processor_HTML_Remove_HotReload_On_Build } from './core-web/processor/Processor_HTML_Remove_HotReload_On_Build.js';
import { Builder } from './core/Builder.js';
import { Processor_Set_Writable } from './core/processor/Processor_Set_Writable.js';
import { Processor_TypeScript_Generic_Bundler } from './core/processor/Processor_TypeScript_Generic_Bundler.js';
import { Step_Bun_Run } from './core/step/Step_Bun_Run.js';
import { Step_FS_Clean_Directory } from './core/step/Step_FS_Clean_Directory.js';
import { Step_Run_Self_Hosted_Server } from './lib-self-hosted-web-app/step/Step_Run_Self_Hosted_Server.js';
import { Step_Self_Hosted_Server_Websocket_Reload } from './lib-self-hosted-web-app/step/Step_Self_Hosted_Server_Websocket_Reload.js';

// If needed, add `cache` directory to the logger's file writer.
// await AddLoggerOutputDirectory('cache');

// Use command line arguments to set developer mode.
if (BunPlatform_Argv_Includes('--dev')) {
  Builder.SetMode(Builder.MODE.DEV);
}
// Set the logging verbosity
Builder.SetVerbosity(Builder.VERBOSITY._1_LOG);

// These steps are run during the startup phase only.
Builder.SetStartUpSteps(
  Step_Dev_Project_Update_Config({ project_path: '.' }),
  Step_Bun_Run({ cmd: ['bun', 'update', '--latest'], showlogs: false }),
  Step_Bun_Run({ cmd: ['bun', 'install'], showlogs: false }),
  //
);

// Keep the out directory intact unless doing a full build. Specifically, we
// don't want to keep deleting "auth.db".
if (Builder.GetMode() === Builder.MODE.BUILD) {
  Builder.AddStartUpSteps(
    Step_FS_Clean_Directory(Builder.Dir.Out),
    //
  );
}

// These steps are run before each processing phase.
Builder.SetBeforeProcessingSteps(
  Step_Self_Hosted_Server_Websocket_Reload(),
  //
);

// Basic setup for a TypeScript project. TypeScript files that match
// "*.module.ts" and "*.iife.ts" are bundled and written to the out folder. The
// other TypeScript files do not produce bundles. Module scripts
// ("*.module.ts") will not bundle other module scripts. Instead, they'll
// import whatever exports are needed from other module scripts. IIFE scripts
// ("*.iife.ts"), on the other hand, produce fully contained bundles. They do
// not import anything from anywhere. Use them accordingly.

// HTML custom components are a lightweight alternative to web components made
// possible by the processor I wrote.

// The processors are run for every file that added them during every
// processing phase.
Builder.SetProcessorModules(
  Processor_HTML_Remove_HotReload_On_Build(),
  // Process the HTML custom components.
  Processor_HTML_Custom_Component_Processor(),
  // Bundle the server.
  Processor_TypeScript_Generic_Bundler({ target: 'bun' }, { include_patterns: ['server.module.ts'], bundler_mode: 'module' }),
  // Bundle the IIFE scripts and module scripts.
  Processor_TypeScript_Generic_Bundler({}, { bundler_mode: 'iife' }),
  Processor_TypeScript_Generic_Bundler({}, { exclude_patterns: ['server.module.ts'], bundler_mode: 'module' }),
  // Write non-bundle files and non-library files.
  Processor_Set_Writable({ include_patterns: ['**'] }),
  //
);

// These steps are run after each processing phase.
Builder.SetAfterProcessingSteps(
  // During developer mode (see above), the server will start running with
  // hot-reloading enabled for any of your HTML files that have called the
  // `EnableHotReload();` function in a script.
  Step_Run_Self_Hosted_Server(),
  //
);

// These steps are run during the cleanup phase only.
Builder.SetCleanUpSteps(
  Step_Dev_Format({ showlogs: false }),
  //
);

await Builder.Start();
