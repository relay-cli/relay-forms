import type {Field} from '../prompts/index.js';
import {runForm, type RunFormOptions} from '../run.js';
import type {FormTheme} from '../theme.js';
import {ConfigEditor} from './ConfigEditor.js';
import {loadConfig, saveConfig, type SaveConfigOptions} from './file.js';
import type {ConfigChange, ConfigValues} from './values.js';

export interface EditConfigOptions extends RunFormOptions, SaveConfigOptions {
  /** Defaults to "Settings". */
  title?: string;
  theme?: FormTheme;
}

export interface EditConfigResult {
  /** Whether the person saved. When false the file was not touched. */
  saved: boolean;
  /** The document as it is now on disk. */
  values: ConfigValues;
  changes: ConfigChange[];
}

/**
 * Open a JSON configuration file in the editor and write it back when the
 * person saves. Keys the fields do not describe are preserved. Rejects with
 * `FormCancelledError` on Ctrl+C, leaving the file unchanged.
 */
export const editConfig = async (
  path: string,
  fields: readonly Field[],
  options: EditConfigOptions = {},
): Promise<EditConfigResult> => {
  const original = await loadConfig(path);
  const result = await runForm<EditConfigResult>(
    ({submit}) => (
      <ConfigEditor
        title={options.title ?? 'Settings'}
        subtitle={path}
        fields={fields}
        values={original}
        onSave={(values, changes) => submit({saved: true, values, changes})}
        onQuit={() => submit({saved: false, values: original, changes: []})}
        {...(options.theme === undefined ? {} : {theme: options.theme})}
      />
    ),
    options,
  );
  if (result.saved && result.changes.length > 0) {
    await saveConfig(path, result.values, options.mode === undefined ? {} : {mode: options.mode});
  }
  return result;
};
