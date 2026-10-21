import {Box, Text} from 'ink';
import {FormFrame} from '../frame/index.js';
import {relayTheme} from '../theme.js';

const rows: ReadonlyArray<readonly [string, string]> = [
  ['Project name', 'relay-demo'],
  ['Package manager', 'npm'],
  ['Features', 'tests, lint'],
];

/** A static preview of a finished setup flow. */
export const DemoForm = () => (
  <FormFrame
    title="Relay Forms"
    subtitle="setup preview"
    footer={<Text color={relayTheme.muted}>enter continue · esc back · ctrl+c cancel</Text>}
  >
    {rows.map(([label, value]) => (
      <Box key={label} gap={1}>
        <Text color={relayTheme.success}>✔</Text>
        <Text color={relayTheme.text}>{label}</Text>
        <Text color={relayTheme.muted}>{value}</Text>
      </Box>
    ))}
  </FormFrame>
);
