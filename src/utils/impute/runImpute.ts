/**
 * The imputation calculation.
 *
 * Domingos ported the SPSS script to TypeScript in voyages-contribute, and
 * since 0.6.2 the library entry re-exports it. This is the thin wrapper the
 * rest of the app calls.
 *
 * `finalizeEnv` is not optional. The raw `runImpute` leaves its locals as the
 * script computed them; the original applies a set of recodes over those before
 * anything is read back, and skipping that step yields numbers that look
 * plausible and are wrong.
 *
 * @see https://github.com/SlaveVoyages/voyages-contribute/issues/7
 */

import {
  finalizeEnv,
  runImpute as runImputeFromPackage,
} from '@slavevoyages/voyages-contribute';

import { RunImpute } from './types';

/**
 * Raised when the calculation cannot be run.
 *
 * Kept after the calculation shipped: callers still catch it, and a version of
 * the package without the export would otherwise fail as an undefined call
 * somewhere inside the adapters rather than saying what is wrong.
 */
export class ImputeUnavailableError extends Error {
  constructor() {
    super(
      'The imputation calculation is not available in the installed version ' +
        'of @slavevoyages/voyages-contribute. It ships from 0.6.2 onwards.',
    );
    this.name = 'ImputeUnavailableError';
  }
}

/** True once the real calculation is wired in. */
export const isImputeAvailable =
  typeof runImputeFromPackage === 'function' &&
  typeof finalizeEnv === 'function';

export const runImpute: RunImpute = (input, isIam) => {
  if (!isImputeAvailable) {
    throw new ImputeUnavailableError();
  }
  return finalizeEnv(runImputeFromPackage(input, isIam));
};
