#!/usr/bin/env node

import {renderToString} from 'ink';
import {helpText, parseCliOptions} from './cli/options.js';
import {demos} from './demo/index.js';
import {FormCancelledError, runForm} from './run.js';
import {relayFormsVersion} from './version.js';

const main = async (): Promise<void> => {
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
  if (options.demo === undefined) {
    process.stderr.write(`Choose --demo to run the demonstration.\n\n${helpText}`);
    process.exitCode = 2;
    return;
  }
  const Demo = demos[options.demo];
  if (options.snapshot || !process.stdout.isTTY || !process.stdin.isTTY) {
    const columns = process.stdout.columns || 80;
    process.stdout.write(`${renderToString(<Demo interactive={false} />, {columns})}\n`);
    return;
  }

  try {
    const answers = await runForm<Record<string, unknown>>(({submit, cancel}) => (
      <Demo onSubmit={submit} onCancel={cancel} />
    ));
    process.stdout.write(`\n${JSON.stringify(answers, undefined, 2)}\n`);
  } catch (error) {
    if (!(error instanceof FormCancelledError)) throw error;
    process.stderr.write('Cancelled.\n');
    process.exitCode = 130;
  }
};

await main();
