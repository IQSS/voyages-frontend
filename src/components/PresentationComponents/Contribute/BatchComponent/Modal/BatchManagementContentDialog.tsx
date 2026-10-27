/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FunctionComponent, useState } from 'react';

import {
  PlusOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button as MuiButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography as MuiTypography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';

import ApproveBatchModal from './ApproveBatchModal';
import BatchUploadModal from './BatchUploadModal';
import DeleteBatchModal from './DeleteBatchModal';
import EditBatchModal from './EditBatchModal';
import BatchTable from '../Table/BatchTable';
interface BatchManagementContentDialogProps {
  createModalVisible: boolean;
  setCreateModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  batches: PublicationBatch[];
  loading: boolean;
  filter: 'all' | 'pending' | 'published';
  changeFilter: (newFilter: 'all' | 'pending' | 'published') => Promise<void>;
  refreshBatches: () => Promise<void>;
}

const BatchManagementContentDialog: FunctionComponent<
  BatchManagementContentDialogProps
> = ({
  setCreateModalVisible,
  batches,
  loading,
  filter,
  changeFilter,
  refreshBatches,
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PublicationBatch | null>(
    null,
  );

  const handleEditBatch = (batch: PublicationBatch) => {
    setSelectedBatch(batch);
    setEditModalVisible(true);
  };

  const handleDeleteBatch = (batch: PublicationBatch) => {
    setSelectedBatch(batch);
    setDeleteModalVisible(true);
  };

  const handleApproveBatch = (batch: PublicationBatch) => {
    setSelectedBatch(batch);
    setApproveModalVisible(true);
  };

  const handleEditSuccess = async () => {
    setEditModalVisible(false);
    setSelectedBatch(null);
    await refreshBatches();
  };

  const handleDeleteSuccess = async () => {
    setDeleteModalVisible(false);
    setSelectedBatch(null);
    await refreshBatches();
  };
  return (
    <>
      <Box
        sx={{
          mb: 2,
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left — filter */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel style={{ fontSize: 12, color: '#4e4e4e' }}>
            Filter
          </InputLabel>
          <Select
            value={filter}
            onChange={(e) => changeFilter(e.target.value as any)}
            label="Filter"
            style={{
              textTransform: 'unset',
              height: 34,
              color: '#4e4e4e',
              fontSize: 14,
            }}
          >
            <MenuItem value="all">All Batches</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="published">Published</MenuItem>
          </Select>
        </FormControl>

        {/* Right — action buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <MuiButton
            variant="contained"
            size="small"
            startIcon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            sx={{
              textTransform: 'unset',
              height: 32,
              fontSize: 14,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0f766e 0%, #047857 100%)',
              },
            }}
          >
            Create Batch
          </MuiButton>
          <MuiButton
            variant="contained"
            size="small"
            startIcon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
            sx={{
              textTransform: 'unset',
              height: 32,
              fontSize: 14,
              background: 'linear-gradient(135deg, #37948d 0%, #2a7a74 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2a7a74 0%, #1f5f5a 100%)',
              },
            }}
          >
            Upload Batch
          </MuiButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : batches.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
          <MuiTypography
            variant="body1"
            sx={{ mt: 2, color: 'text.secondary' }}
          >
            No batches found
          </MuiTypography>
          <MuiButton
            variant="text"
            onClick={() => setCreateModalVisible(true)}
            sx={{ mt: 1 }}
          >
            Create your first batch
          </MuiButton>
        </Box>
      ) : (
        <BatchTable
          batches={batches}
          loading={loading}
          onEditBatch={handleEditBatch}
          onDeleteBatch={handleDeleteBatch}
          onApproveBatch={handleApproveBatch}
        />
      )}

      {/* Edit Batch Modal */}
      <EditBatchModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedBatch(null);
        }}
        onSuccess={handleEditSuccess}
        batch={selectedBatch}
      />

      {/* Delete Batch Modal */}
      <DeleteBatchModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedBatch(null);
        }}
        onSuccess={handleDeleteSuccess}
        batch={selectedBatch}
      />

      {/* Upload Batch Modal */}
      <BatchUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={refreshBatches}
        existingBatchTitles={batches.map((b) => b.title)}
      />

      {/* Approve Batch Modal */}
      <ApproveBatchModal
        visible={approveModalVisible}
        onClose={() => {
          setApproveModalVisible(false);
          setSelectedBatch(null);
        }}
        onSuccess={refreshBatches}
        batch={selectedBatch}
      />
    </>
  );
};

export default BatchManagementContentDialog;
