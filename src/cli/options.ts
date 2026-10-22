export const demoNames = ['prompts', 'wizard'] as const;
export type DemoName = (typeof demoNames)[number];

export interface CliOptions {
  help: boolean;
  version: boolean;
  /** The demonstration to run, or `undefined` when none was chosen. */
  demo: DemoName | undefined;
  snapshot: boolean;
}

export const helpText = `Relay Forms

Usage:
  relay-forms --demo [prompts|wizard]
  relay-forms --demo wizard --snapshot

Options:
  --demo [name]      Run a built-in demonstration (default: prompts)
  --snapshot         Print the demonstration's first screen and exit
  -h, --help         Show this help
  -v, --version      Show the version

Demonstrations:
  prompts            A project setup flow that uses every kind of question
  wizard             The same flow split into steps, with a review screen

Relay Forms is a library. Import it from @relay-cli/forms to build your own setup flow.
`;

const isDemoName = (value: string | undefined): value is DemoName =>
  demoNames.includes(value as DemoName);

export const parseCliOptions = (arguments_: readonly string[]): CliOptions => {
  const options: CliOptions = {help: false, version: false, demo: undefined, snapshot: false};
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index] ?? '';
    if (argument === '-h' || argument === '--help') options.help = true;
    else if (argument === '-v' || argument === '--version') options.version = true;
    else if (argument === '--snapshot') options.snapshot = true;
    else if (argument === '--demo' || argument.startsWith('--demo=')) {
      const inline = argument.startsWith('--demo=') ? argument.slice('--demo='.length) : undefined;
      const next = arguments_[index + 1];
      const name = inline ?? (isDemoName(next) ? next : 'prompts');
      if (!isDemoName(name)) throw new Error(`Unknown demonstration: ${name}`);
      if (inline === undefined && name === next) index += 1;
      options.demo = name;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
};
