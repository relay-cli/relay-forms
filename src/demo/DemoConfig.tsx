import {ConfigEditor} from '../config/index.js';
import type {Field} from '../prompts/index.js';
import type {DemoProps} from './types.js';

export const demoConfigFields: Field[] = [
  {kind: 'text', name: 'name', label: 'Service name', required: true},
  {kind: 'number', name: 'server.port', label: 'Port', initial: 3000, min: 1, max: 65535},
  {kind: 'confirm', name: 'server.tls', label: 'Serve over TLS', initial: false},
  {
    kind: 'select',
    name: 'log.level',
    label: 'Log level',
    options: [{value: 'error'}, {value: 'warn'}, {value: 'info'}, {value: 'debug'}],
    initial: 'info',
  },
  {
    kind: 'multiselect',
    name: 'features',
    label: 'Features',
    options: [{value: 'metrics'}, {value: 'tracing'}, {value: 'health'}],
  },
  {kind: 'text', name: 'token', label: 'API token', mask: true, hint: 'Stored in the file.'},
];

export const demoConfigValues = {
  name: 'relay-api',
  server: {port: 8080},
  log: {level: 'verbose'},
  features: ['health'],
};

/** A configuration editor over an in-memory document; nothing is written to disk. */
export const DemoConfig = ({interactive = true, onSubmit}: DemoProps) => (
  <ConfigEditor
    title="Relay Forms"
    subtitle="demo.json"
    fields={demoConfigFields}
    values={demoConfigValues}
    isActive={interactive}
    onSave={(values) => onSubmit?.(values)}
    onQuit={() => onSubmit?.(demoConfigValues)}
  />
);
