import type { CommandResult } from '../../lib/command.js';
import { confirmChange } from '../../lib/prompt.js';
import { productionProjectId } from '../../lib/target.js';
import { findRepoRoot } from '../../utils/node-version.js';
import { countDocuments, getData, getPathObject, saveData } from './utils.js';

export interface CopyOptions {
  /** Read and check the data without writing it. */
  dryRun?: boolean;
  /** Write to production without asking. */
  yes?: boolean;
}

export const runFirestoreCopy = async (
  source: string,
  destination: string,
  { dryRun = false, yes = false }: CopyOptions = {},
): Promise<CommandResult | false> => {
  const projectId = productionProjectId(findRepoRoot(process.cwd()) ?? process.cwd());
  const toFile = Boolean(getPathObject(destination).file);
  const into = toFile ? destination : `${destination} in ${projectId ?? 'the emulator'}`;
  const data = await getData(source);
  const documents = countDocuments(toFile ? source : destination, data);
  const count = `${documents} ${documents === 1 ? 'document' : 'documents'}`;
  if (
    !dryRun &&
    !toFile &&
    projectId &&
    !(await confirmChange(
      `Write ${count} to ${into}? Documents with the same IDs are replaced.`,
      yes,
    ))
  ) {
    return false;
  }
  await saveData(data, destination, { dryRun });
  console.log(
    dryRun
      ? `✔ ${count} from ${source} ${documents === 1 ? 'is' : 'are'} valid. Dry run: nothing was written to ${into}.`
      : `✔ Copied ${count} from ${source} to ${into}.`,
  );
  return { ok: true, documents, dryRun };
};
