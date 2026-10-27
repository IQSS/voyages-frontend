import { useState } from 'react';

import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import {
  FieldValue,
  getSchema,
  isMaterializedEntity,
  isMaterializedEntityArray,
  MaterializedEntity,
} from '@slavevoyages/voyages-contribute';

export interface EntityViewProps {
  entity: MaterializedEntity;
  hideEmptyFields: boolean;
  defaultExpanded?: boolean;
}

const isEmptyValue = (value: FieldValue) =>
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

export const EntityView = ({ entity, hideEmptyFields }: EntityViewProps) => {
  const schema = getSchema(entity.entityRef.schema);
  const label = schema.getLabel(entity.data, false);
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        className="section-header-review"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Typography>
          {label}
          {expanded ? (
            <CaretUpOutlined className="expanded-icon" />
          ) : (
            <CaretDownOutlined style={{ marginLeft: 10, fontSize: 18 }} />
          )}
        </Typography>
      </Box>
      {expanded && (
        <Box sx={{ pl: 2, mt: 1 }}>
          {Object.entries(entity.data)
            .filter(([_, value]) => !hideEmptyFields || !isEmptyValue(value))
            .map(([key, value]) => (
              <Box key={key} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>{formatLabel(key)}:</strong>{' '}
                </Typography>
                {isMaterializedEntity(value) ? (
                  <Box
                    sx={{
                      pl: 2,
                      borderLeft: '1.5px solid rgb(55, 148, 141)',
                      mt: 1,
                    }}
                  >
                    <EntityView
                      entity={value}
                      hideEmptyFields={hideEmptyFields}
                    />
                  </Box>
                ) : isMaterializedEntityArray(value) ? (
                  value.map((v, i) => (
                    <Box
                      key={i}
                      sx={{
                        pl: 2,
                        borderLeft: '1.5px solid rgb(55, 148, 141)',
                        mt: 1,
                      }}
                    >
                      <EntityView
                        entity={v}
                        hideEmptyFields={hideEmptyFields}
                      />
                    </Box>
                  ))
                ) : (
                  <span>{value ?? '—'}</span>
                )}
              </Box>
            ))}
        </Box>
      )}
    </Box>
  );
};

function formatLabel(label: string) {
  return label.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
