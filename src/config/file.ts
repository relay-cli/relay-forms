import {randomBytes} from 'node:crypto';
import {mkdir, readFile, rename, rm, stat, writeFile} from 'node:fs/promises';
import {dirname, join, basename} from 'node:path';
import type {ConfigValues} from './values.js';

export interface SaveConfigOptions {
  /**
   * File permissions for the written file. Use `0o600` when the file holds
   * secrets. Defaults to the permissions of the file being replaced, or the
   * process umask for a new file.
   */
  mode?: number;
}

/**
 * Read a JSON configuration file. A missing file reads as an empty document; a
 * file that is not a JSON object is an error rather than being overwritten.
 */
export const loadConfig = async (path: string): Promise<ConfigValues> => {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
  if (text.trim() === '') return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, {cause: error});
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${path} must contain a JSON object.`);
  }
  return parsed as ConfigValues;
};

const existingMode = async (path: string): Promise<number | undefined> => {
  try {
    return (await stat(path)).mode & 0o777;
  } catch {
    return undefined;
  }
};

/**
 * Write a configuration file as two-space JSON with a trailing newline. The
 * file is written beside the target and renamed into place, so a crash never
 * leaves half a file.
 */
export const saveConfig = async (
  path: string,
  values: ConfigValues,
  options: SaveConfigOptions = {},
): Promise<void> => {
  const directory = dirname(path);
  await mkdir(directory, {recursive: true});
  const mode = options.mode ?? (await existingMode(path));
  const temporary = join(directory, `.${basename(path)}.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(values, undefined, 2)}\n`, {
      encoding: 'utf8',
      ...(mode === undefined ? {} : {mode}),
    });
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, {force: true});
    throw error;
  }
};
