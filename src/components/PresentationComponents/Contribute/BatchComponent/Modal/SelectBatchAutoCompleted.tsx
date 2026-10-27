import React, { FunctionComponent } from 'react';

import { Typography, Box, Alert, Autocomplete, TextField } from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';
interface SelectSearchDropdownListProps {
  selectedBatch: PublicationBatch | null;
  setSelectedBatch: React.Dispatch<
    React.SetStateAction<PublicationBatch | null>
  >;
  batches: PublicationBatch[];
  setBatches: React.Dispatch<React.SetStateAction<PublicationBatch[]>>;
  loading: boolean;
  contributionIds: string[];
}

const SelectBatchAutoCompleted: FunctionComponent<
  SelectSearchDropdownListProps
> = ({
  setSelectedBatch,
  selectedBatch,
  batches,
  loading,
  contributionIds,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Autocomplete
        value={selectedBatch}
        onChange={(event, newValue) => {
          setSelectedBatch(newValue);
        }}
        id="tags-outlined"
        options={batches}
        getOptionLabel={(option) => option.title || '--'}
        filterSelectedOptions
        isOptionEqualToValue={(option, value) => option.id === value.id}
        disabled={loading}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            /**
             * A fixed label. It used to interpolate the selected batch title,
             * which overflowed the fieldset notch that clips it -- long titles
             * were cut mid-word and forced the dialog to scroll sideways. The
             * selection is already visible in the input itself, and again in the
             * summary below, so naming it here said the same thing a third time.
             */
            label="Select Publication Batch"
            placeholder="Type to search batches..."
            size="small"
          />
        )}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <Box component="li" key={key} {...rest}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {option.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block' }}
                >
                  {option.comments || 'No description'}
                </Typography>
              </Box>
            </Box>
          );
        }}
        noOptionsText={
          loading ? 'Loading batches...' : 'No pending batches available'
        }
        sx={{ mb: 2, mt: 1 }}
      />

      {batches.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No pending batches available. Create a new batch first.
        </Alert>
      )}

      {selectedBatch && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Assignment Summary:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {contributionIds.length} contribution(s) will be assigned
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Target batch: {selectedBatch.title}
          </Typography>
          {selectedBatch.comments && (
            <Typography variant="body2" color="text.secondary">
              • Description: {selectedBatch.comments}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SelectBatchAutoCompleted;
