// Contribute/BatchComponent/hooks/useBatchManagement.ts
import { useState, useCallback, useEffect } from 'react';

import { PublicationBatch } from '@slavevoyages/voyages-contribute';
import { message } from 'antd';

import { batchApi, getBatchStatus } from '@/fetch/contributeFetch/batchApi';

interface UseBatchManagementOptions {
  autoFetch?: boolean;
  initialFilter?: 'all' | 'pending' | 'published';
}

export const useBatchManagement = (options: UseBatchManagementOptions = {}) => {
  const { autoFetch = false, initialFilter = 'all' } = options;

  const [batches, setBatches] = useState<PublicationBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>(
    initialFilter,
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch batches
  const fetchBatches = useCallback(
    async (filterType?: 'all' | 'pending' | 'published') => {
      const currentFilter = filterType || filter;
      setLoading(true);
      setError(null);

      try {
        const response = await batchApi.getBatches(currentFilter);
        const { batches: fetchedBatches, filter, count } = response;
        setBatches(fetchedBatches);
        setFilter(filter as 'all' | 'pending' | 'published');
        setCount(count);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch batches';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  // Create batch
  const createBatch = useCallback(
    async (data: PublicationBatch): Promise<PublicationBatch | null> => {
      setLoading(true);

      try {
        const newBatch = await batchApi.createBatch(data);
        message.success('Publication batch created successfully');

        // Refresh batches if we're showing all or pending batches
        if (filter === 'all' || filter === 'pending') {
          await fetchBatches();
        }

        return newBatch;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create batch';
        setError(errorMessage);
        message.error(`Error creating batch: ${errorMessage}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filter, fetchBatches],
  );

  // Assign single contribution to batch
  const assignContributionToBatch = useCallback(
    async (
      contributionId: string,
      batchId: number | null,
    ): Promise<boolean> => {
      try {
        await batchApi.assignContributionToBatch(contributionId, batchId);
        message.success('Contribution assigned to batch successfully');
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to assign contribution';
        setError(errorMessage);
        message.error(`Error assigning contribution: ${errorMessage}`);
        return false;
      }
    },
    [],
  );

  // Bulk assign contributions to batch
  const bulkAssignContributionsToBatch = useCallback(
    async (
      contributionIds: string[],
      batchId: number | null,
    ): Promise<boolean> => {
      setLoading(true);

      try {
        await batchApi.bulkAssignContributionsToBatch(contributionIds, batchId);
        message.success(
          `Successfully assigned ${contributionIds.length} contribution(s) to batch`,
        );
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to assign contributions';
        setError(errorMessage);
        message.error(`Error assigning contributions: ${errorMessage}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Change filter and fetch
  const changeFilter = useCallback(
    async (newFilter: 'all' | 'pending' | 'published') => {
      setFilter(newFilter);
      await fetchBatches(newFilter);
    },
    [fetchBatches],
  );

  // Get batches by status
  const getPendingBatches = useCallback(async (): Promise<
    PublicationBatch[]
  > => {
    try {
      return await batchApi.getPendingBatches();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch pending batches';
      setError(errorMessage);
      message.error(errorMessage);
      return [];
    }
  }, []);

  const getPublishedBatches = useCallback(async (): Promise<
    PublicationBatch[]
  > => {
    try {
      return await batchApi.getPublishedBatches();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch published batches';
      setError(errorMessage);
      message.error(errorMessage);
      return [];
    }
  }, []);

  // Update batch
  const updateBatch = useCallback(
    async (
      batchId: number,
      data: Partial<PublicationBatch>,
    ): Promise<boolean> => {
      setLoading(true);

      try {
        await batchApi.updateBatch(batchId, data);
        message.success('Batch updated successfully');

        // Refresh batches to show updated data
        await fetchBatches();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update batch';
        setError(errorMessage);
        message.error(`Error updating batch: ${errorMessage}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchBatches],
  );

  // Delete batch
  const deleteBatch = useCallback(
    async (batchId: number): Promise<boolean> => {
      setLoading(true);

      try {
        await batchApi.deleteBatch(batchId);
        message.success('Batch deleted successfully');

        // Refresh batches to remove deleted batch
        await fetchBatches();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete batch';
        setError(errorMessage);
        message.error(`Error deleting batch: ${errorMessage}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchBatches],
  );

  // Refresh batches
  const refreshBatches = useCallback(() => {
    return fetchBatches();
  }, [fetchBatches]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchBatches();
    }
  }, [autoFetch, fetchBatches]);

  return {
    // State
    batches,
    loading,
    error,
    filter,

    // Actions
    fetchBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    assignContributionToBatch,
    bulkAssignContributionsToBatch,
    changeFilter,
    refreshBatches,

    // Utility functions
    getPendingBatches,
    getPublishedBatches,

    // Computed values
    pendingBatches: batches.filter(
      (batch) => getBatchStatus(batch) === 'pending',
    ),
    publishedBatches: batches.filter(
      (batch) => getBatchStatus(batch) === 'published',
    ),
    batchCount: count,
  };
};

// Additional utility hook for batch selection
export const useBatchSelection = () => {
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<PublicationBatch | null>(
    null,
  );

  const selectBatch = useCallback((batch: PublicationBatch | null) => {
    setSelectedBatch(batch);
    setSelectedBatchId(batch?.id || null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBatch(null);
    setSelectedBatchId(null);
  }, []);

  return {
    selectedBatchId,
    selectedBatch,
    selectBatch,
    clearSelection,
    hasSelection: selectedBatch !== null,
  };
};
