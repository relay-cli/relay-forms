#!/usr/bin/env node

import {renderToString} from 'ink';
import {helpText, parseCliOptions} from './cli/options.js';
import {DemoForm} from './demo/index.js';
import {relayFormsVersion} from './version.js';

const main = (): void => {
  let options;
  try {
    options = parseCliOptions(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n\n${helpText}`,
    );
    process.exitCode = 2;
    return;
  }
  if (options.help) return void process.stdout.write(helpText);
  if (options.version) return void process.stdout.write(`${relayFormsVersion}\n`);
  if (!options.demo) {
    process.stderr.write(`Choose --demo to run the demonstration.\n\n${helpText}`);
    process.exitCode = 2;
    return;
  }
  const columns = process.stdout.columns || 80;
  process.stdout.write(`${renderToString(<DemoForm />, {columns})}\n`);
};

main();
