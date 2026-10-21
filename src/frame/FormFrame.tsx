import type {ReactNode} from 'react';
import {Box, Text} from 'ink';
import {relayTheme} from '../theme.js';
import type {FormTheme} from '../theme.js';

export interface FormFrameProps {
  title: string;
  subtitle?: string;
  theme?: FormTheme;
  /** Fixed width in columns. Defaults to the content width. */
  width?: number;
  /** Key hints or status shown below the body, usually muted. */
  footer?: ReactNode;
  children?: ReactNode;
}

/**
 * The chrome around a setup flow rendered in the normal terminal: a title row,
 * a body set off by a rule on the left, and an optional footer.
 */
export const FormFrame = ({
  title,
  subtitle,
  theme = relayTheme,
  width,
  footer,
  children,
}: FormFrameProps) => (
  <Box flexDirection="column" {...(width === undefined ? {} : {width})}>
    <Text wrap="truncate-end">
      <Text color={theme.accent}>◆</Text>
      <Text bold color={theme.text}>
        {' '}
        {title}
      </Text>
      {subtitle === undefined ? null : <Text color={theme.muted}> · {subtitle}</Text>}
    </Text>
    {children === undefined ? null : (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderTop={false}
        borderRight={false}
        borderBottom={false}
        borderColor={theme.rule}
        paddingLeft={1}
      >
        {children}
      </Box>
    )}
    {footer === undefined ? null : (
      <Box flexDirection="column" paddingLeft={2}>
        {footer}
      </Box>
    )}
  </Box>
);
