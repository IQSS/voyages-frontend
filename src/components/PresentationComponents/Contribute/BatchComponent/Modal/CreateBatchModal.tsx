import React, { useState } from 'react';

import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';
import { Button, Card, Col, Input, Row, Space, Spin, Typography } from 'antd';

import { PaperDraggableCreateBatch } from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { StyleDialogOnTop } from '@/styleMUI';

const { TextArea } = Input;
const { Text } = Typography;

interface CreateBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createBatch: (data: PublicationBatch) => Promise<PublicationBatch | null>;
  loading: boolean;
}

const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  visible,
  onClose,
  onSuccess,
  createBatch,
  loading,
}) => {
  const [formData, setFormData] = useState<PublicationBatch>({
    id: 0,
    title: '',
    comments: '',
    published: null,
  });
  const [errors, setErrors] = useState<Partial<PublicationBatch>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PublicationBatch> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a batch title';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    if (formData.comments.length > 500) {
      newErrors.comments = 'Comments must be less than 500 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await createBatch({ ...formData, id: 0, published: 0 });
    if (result) {
      handleClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    setFormData({ id: 0, title: '', comments: '', published: null });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof PublicationBatch, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      disableScrollLock={false}
      sx={StyleDialogOnTop}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperDraggableCreateBatch}
      aria-labelledby="draggable-dialog-create-batch"
    >
      <DialogTitle
        sx={{
          cursor: 'move',
          position: 'relative',
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'rgb(55, 148, 141)',
          color: '#fff',
          py: 2,
        }}
      >
        <Text
          style={{
            margin: 0,
            color: '#fff',
            fontSize: '1.25rem',
            fontWeight: 600,
          }}
        >
          Create Publication Batch
        </Text>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Card
            variant="outlined"
            style={{ padding: 0, background: 'transparent', boxShadow: 'none' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#4e4e4e',
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Batch Title: <span style={{ color: '#ff4d4f' }}>*</span>
                </Text>
                <Input
                  placeholder="Batch Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  status={errors.title ? 'error' : ''}
                  maxLength={100}
                  showCount
                  style={{ marginBottom: 4 }}
                />
                {errors.title && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {errors.title}
                  </Text>
                )}
              </div>

              <div>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#4e4e4e',
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Comments
                </Text>
                <TextArea
                  placeholder="Add any notes or comments about this batch..."
                  value={formData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  status={errors.comments ? 'error' : ''}
                  rows={4}
                  maxLength={500}
                  showCount
                  style={{ marginBottom: 4 }}
                />
                {errors.comments && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {errors.comments}
                  </Text>
                )}
              </div>

              <Row justify="space-between">
                <Col>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Title: {formData.title.length}/100 characters
                  </Text>
                </Col>
                <Col>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Comments: {formData.comments.length}/500 characters
                  </Text>
                </Col>
              </Row>
            </Space>
          </Card>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Space>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              disabled={loading || !formData.title.trim()}
              style={{
                textTransform: 'unset',
                height: 32,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
              }}
            >
              {loading ? (
                <Space>
                  <Spin size="small" />
                  Creating…
                </Space>
              ) : (
                'Create Batch'
              )}
            </Button>
          </Space>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateBatchModal;
