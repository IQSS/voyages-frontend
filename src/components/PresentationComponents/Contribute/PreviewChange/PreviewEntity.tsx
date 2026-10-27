import { useState } from 'react';

import { Checkbox, FormControlLabel } from '@mui/material';
import { MaterializedEntity } from '@slavevoyages/voyages-contribute';

import { EntityView } from '../EntityView';

interface PreviewEntityProps {
  entity: MaterializedEntity;
}

const PreviewEntity = ({ entity }: PreviewEntityProps) => {
  const [hideEmptyFields, setHideEmptyFields] = useState(true);

  return (
    <>
      <FormControlLabel
        label="Hide empty fields"
        control={
          <Checkbox
            checked={hideEmptyFields}
            onChange={() => setHideEmptyFields((prev) => !prev)}
          />
        }
      />
      <EntityView
        entity={entity}
        hideEmptyFields={hideEmptyFields}
        defaultExpanded
      />
    </>
  );
};

export default PreviewEntity;
