import { NODE_PATH } from '../src/lib/ericchase/NodePlatform.js';
import { Builder } from './core/Builder.js';
import { Step_Async } from './core/step/Step_Async.js';
import { Step_Bun_Run } from './core/step/Step_Bun_Run.js';
import { Step_FS_Mirror_Directory } from './core/step/Step_FS_Mirror_Directory.js';

// This script pulls template lib files from template project.

const template_path = 'C:/Code/Base/JavaScript-TypeScript/Templates/Self-Hosted-Web-App';
const lib_folders: string[] = ['lib-self-hosted-web-app'];

Builder.SetStartUpSteps(
  Step_Bun_Run({ cmd: ['bun', 'install'], showlogs: false }),
  Step_Async(
    lib_folders.map((dir: string) =>
      Step_FS_Mirror_Directory({
        from_path: NODE_PATH.join(template_path, 'tools/' + dir),
        to_path: NODE_PATH.join(Builder.Dir.Tools, dir),
        include_patterns: ['**/*'],
      }),
    ),
  ),
  //
);

await Builder.Start();
