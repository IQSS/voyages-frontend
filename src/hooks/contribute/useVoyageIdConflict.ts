import { useEffect, useState } from 'react';

import {
  checkVoyageId,
  VoyageIdCheck,
} from '@/utils/contribute/voyageIdConflict';

type CheckState = VoyageIdCheck | { status: 'idle' | 'checking' };

/**
 * Checks, shortly after it stops changing, whether the Voyage ID given to a new
 * voyage is free. `fieldError` is shown on the field; `acceptBlocker` holds
 * Accept back until a check has found the ID free.
 */
export const useVoyageIdConflict = (
  voyageId: string | undefined,
  contributionId: string | undefined,
  enabled: boolean,
) => {
  const [check, setCheck] = useState<CheckState>({ status: 'idle' });
  const id = voyageId?.trim() ?? '';

  useEffect(() => {
    if (!enabled || !id || !contributionId) {
      setCheck({ status: 'idle' });
      return;
    }
    setCheck({ status: 'checking' });
    let current = true;
    const timer = setTimeout(async () => {
      const result = await checkVoyageId(id, contributionId);
      if (current) setCheck(result);
    }, 500);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [id, contributionId, enabled]);

  const fieldError =
    check.status === 'taken' || check.status === 'failed'
      ? check.reason
      : undefined;
  const acceptBlocker =
    check.status === 'checking'
      ? `Checking whether Voyage ID ${id} is free…`
      : fieldError;
  return { fieldError, acceptBlocker, taken: check.status === 'taken' };
};
