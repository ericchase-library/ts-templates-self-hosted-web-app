import { NODE_PATH } from '../src/lib/ericchase/NodePlatform.js';
import { Builder } from './core/Builder.js';
import { Step_FS_Mirror_Directory } from './core/step/Step_FS_Mirror_Directory.js';

Builder.SetStartUpSteps(
  Step_FS_Mirror_Directory({
    from_path: NODE_PATH.join('C:/Code/Base/JavaScript-TypeScript/Templates/Self-Hosted-Web-App', 'tools/lib-self-hosted-web-app'),
    to_path: NODE_PATH.join(Builder.Dir.Tools, 'lib-self-hosted-web-app'),
    include_patterns: ['**/*'],
  }),
  //
);

await Builder.Start();
