import React, { useCallback, useState } from 'react';

import { Comment } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import { Property } from '@slavevoyages/voyages-contribute';
import TextArea from 'antd/es/input/TextArea';

import { lowerCaseFirstLetter } from './DirectEntityPropertyField';

export interface EntityPropertyChangeCommentBoxProps {
  property: Property;
  current?: string;
  onComment: (comment: string) => void;
  readOnly?: boolean;
}

export const EntityPropertyChangeCommentBox = ({
  property,
  current,
  onComment,
  readOnly = false,
}: EntityPropertyChangeCommentBoxProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    },
    [],
  );
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  return (
    <>
      {!readOnly && (
        <IconButton
          onClick={handleClick}
          sx={{
            position: 'absolute',
            right: '-15px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          aria-label="add comment"
        >
          <Comment />
        </IconButton>
      )}
      <Popover
        open={anchorEl !== null}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <TextArea
          rows={3}
          value={current ?? ''}
          placeholder={
            readOnly
              ? ''
              : `Enter your comments for ${lowerCaseFirstLetter(property.label)} here`
          }
          onChange={readOnly ? undefined : (e) => onComment(e.target.value)}
          style={{ width: '100%' }}
          readOnly={readOnly}
        />
      </Popover>
    </>
  );
};
