import React from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';

interface ActionCellRendererProps {
  data: any;
  onEdit?: (data: any) => void;
  onDelete?: (contributionId: string) => Promise<void>;
}

const ActionCellRenderer: React.FC<ActionCellRendererProps> = ({
  data,
  onEdit,
  onDelete,
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Delete Contribution',
      content: `Are you sure you want to delete this contribution id:${data?.id})?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        if (onDelete && data?.id) {
          try {
            await onDelete(data.id);
          } catch (error) {
            console.error('Failed to delete contribution:', error);
          }
        }
      },
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        bottom: 4,
      }}
    >
      <Button
        type="link"
        icon={<EditOutlined />}
        onClick={handleEdit}
        style={{ padding: 0 }}
        title="Edit"
      />
      <Button
        type="link"
        danger
        icon={<DeleteOutlined />}
        onClick={handleDelete}
        style={{ padding: 0 }}
        title="Delete"
      />
    </div>
  );
};

export default ActionCellRenderer;
