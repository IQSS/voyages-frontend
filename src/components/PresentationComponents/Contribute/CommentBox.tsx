import React from 'react';
import { Box } from '@mui/material';
import TextArea from 'antd/es/input/TextArea';

interface CommentBoxProps {
  isVisible: boolean;
  comments: { [key: string]: string }
  fieldKey: string;
  onChange: (value: string) => void;
}

const CommentBox = React.forwardRef<HTMLDivElement, CommentBoxProps>(
  ({ isVisible, comments, fieldKey, onChange }, ref) => {
    if (!isVisible) return null;
    const currentComment = comments[fieldKey] || '';


    return (
      <Box
        ref={ref}
        sx={{
          position: 'absolute',
          top: 'calc(152% + 2px)',
          right: 20,
          width: '45%',
          zIndex: 1,
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: 1,
          padding: '4px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <TextArea
          rows={3}
          value={currentComment}
          placeholder="Please enter your comments here"
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%' }}
        />
      </Box>
    );
  }
)

export default CommentBox;




