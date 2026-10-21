export interface CliOptions {
  help: boolean;
  version: boolean;
  demo: boolean;
  snapshot: boolean;
}

export const helpText = `Relay Forms

Usage:
  relay-forms --demo
  relay-forms --demo --snapshot

Options:
  --demo             Run the built-in setup demonstration
  --snapshot         Print the demonstration's first screen and exit
  -h, --help         Show this help
  -v, --version      Show the version

Relay Forms is a library. Import it from @relay-cli/forms to build your own setup flow.
`;

export const parseCliOptions = (arguments_: readonly string[]): CliOptions => {
  const options: CliOptions = {help: false, version: false, demo: false, snapshot: false};
  for (const argument of arguments_) {
    if (argument === '-h' || argument === '--help') options.help = true;
    else if (argument === '-v' || argument === '--version') options.version = true;
    else if (argument === '--demo') options.demo = true;
    else if (argument === '--snapshot') options.snapshot = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
};
