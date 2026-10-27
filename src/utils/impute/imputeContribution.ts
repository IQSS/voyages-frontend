/**
 * Run imputation over a contribution and stack the result as a bot review.
 *
 * All of this happens in the browser. The imputed values are not written to the
 * voyage directly — they become one more review on the stack, so an editor sees
 * them as a normal diff and can accept, reject, or edit on top of them.
 */

import { MaterializedEntity, Review } from '@slavevoyages/voyages-contribute';

import { createCodeLookup } from './codeLookup';
import { readVoyage } from './readVoyage';
import { runImpute } from './runImpute';
import { collectTouchedKeys, writeVoyage } from './writeVoyage';

/**
 * Reserved author for bot-written reviews. `ChangeSet.author` is a free string
 * and `Review` has no marker column, so this is what distinguishes a bot review
 * from a human one — both for the UI and for the override rule below.
 */
export const IMPUTE_BOT_AUTHOR = 'Impute bot version 1.0';

export interface ImputeRunResult {
  /** False when every computed value already matched the record. */
  changed: boolean;
  /** Properties left alone because an editor had already set them. */
  skipped: string[];
  /** Codes the calculation produced that no entity carries. */
  unresolvedCodes: string[];
  /**
   * The bot's review, present only when there was something to write.
   *
   * Deliberately returned rather than submitted here: the caller hands it to
   * the same commit path a human review uses, which both persists it and
   * refreshes the on-screen stack. Submitting directly would save the review
   * but leave the editor staring at an unchanged diff.
   */
  review?: Review;
}

/** Names what the bot declined to write, so the diff is self-explaining. */
const buildComments = (skipped: string[]): string => {
  if (skipped.length === 0) {
    return 'Imputed values.';
  }
  const noun = skipped.length === 1 ? 'property' : 'properties';
  return (
    `Imputed values. Skipped ${skipped.length} ${noun} already set by an ` +
    `editor: ${skipped.join(', ')}.`
  );
};

export interface ImputeContributionArgs {
  /** The voyage with the contribution and review stack already applied. */
  entity: MaterializedEntity;
  reviews: Review[];
}

export const imputeContribution = async ({
  entity,
  reviews,
}: ImputeContributionArgs): Promise<ImputeRunResult> => {
  const { input, isIam } = readVoyage(entity);
  const env = runImpute(input, isIam);

  // Properties a human editor already decided. The bot's review lands on top of
  // these, so re-asserting its own value would silently revert them.
  const protectedKeys = collectTouchedKeys(
    reviews
      .filter((r) => r.changeSet.author !== IMPUTE_BOT_AUTHOR)
      .flatMap((r) => r.changeSet.changes),
  );

  const { lookUp, unresolved } = createCodeLookup();
  const { changes, skipped } = await writeVoyage(entity, env, {
    lookUp,
    newId: () => crypto.randomUUID(),
    protectedKeys,
  });

  if (changes.length === 0) {
    return { changed: false, skipped, unresolvedCodes: unresolved };
  }

  const review: Review = {
    changeSet: {
      id: crypto.randomUUID(),
      author: IMPUTE_BOT_AUTHOR,
      title: 'Impute',
      comments: buildComments(skipped),
      timestamp: Date.now(),
      changes,
    },
    // The server recomputes this from the existing stack; sent for completeness.
    stackOrder: reviews.length + 1,
  };

  return { changed: true, skipped, unresolvedCodes: unresolved, review };
};
