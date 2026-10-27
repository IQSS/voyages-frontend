import { useCallback, useEffect, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tooltip,
} from 'antd';

import {
  createSource,
  createSourceType,
  fetchSourceTypes,
  SourceType,
} from '@/fetch/contributeFetch/fetchSourcesData';

const { TextArea } = Input;

// Fallback source-type vocabulary, matching the legacy Voyage Admin "Add
// Source" dropdown. Used for the list's type filter and if the live
// SourceTypeList endpoint can't be reached.
export const SOURCE_TYPE_NAMES = [
  'Documentary source',
  'Newspaper',
  'Published source',
  'Unpublished secondary source',
  'Private note or collection',
];

interface AddSourceValues {
  shortRef: string;
  fullRef: string;
  sourceType: string;
}

interface AddSourceModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a source is created, so the list can refresh. */
  onCreated?: () => void;
}

// ── Nested "Add Source type" form (the legacy "+" popup) ─────────────────────
// The new document.SourceType model has only a name (the legacy Group id /
// Group name belonged to the old voyage.VoyageSourcesType model), so this is a
// single Name field. On save it creates the type and returns it to the caller.
const AddSourceTypeModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreated: (type: SourceType) => void;
}> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm<{ name: string }>();
  const [submitting, setSubmitting] = useState(false);

  const handleOk = async () => {
    try {
      const { name } = await form.validateFields();
      setSubmitting(true);
      const created = await createSourceType(name.trim());
      message.success('Source type added');
      form.resetFields();
      onCreated(created);
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      message.error('Failed to add source type');
      console.error('Add source type error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add Source type"
      open={open}
      onCancel={handleCancel}
      maskClosable={false}
      confirmLoading={submitting}
      onOk={handleOk}
      okText="Save"
    >
      <Form form={form} layout="vertical" requiredMark>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g. Documentary source" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// In-app Add Source form matching the legacy Voyage Admin "Add Source" screen:
// Short ref / Full ref / Source type. Creates a document.Source via the API.
const AddSourceModal: React.FC<AddSourceModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [form] = Form.useForm<AddSourceValues>();
  const [submitting, setSubmitting] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const loadTypes = useCallback(() => {
    setLoadingTypes(true);
    return fetchSourceTypes()
      .then((types) => {
        setSourceTypes(types);
        return types;
      })
      .catch((error) => {
        console.error('Source types load error:', error);
        // Fall back to the legacy list so the form still works.
        setSourceTypes(
          SOURCE_TYPE_NAMES.map((name, i) => ({ id: -(i + 1), name })),
        );
        return [] as SourceType[];
      })
      .finally(() => setLoadingTypes(false));
  }, []);

  useEffect(() => {
    if (open) loadTypes();
  }, [open, loadTypes]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await createSource({
        shortRef: values.shortRef,
        fullRef: values.fullRef,
        sourceType: values.sourceType,
      });
      message.success('Source added');
      form.resetFields();
      onCreated?.();
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return; // validation
      message.error('Failed to add source');
      console.error('Add source error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // After a new type is created, refresh the list and select it.
  const handleTypeCreated = async (type: SourceType) => {
    await loadTypes();
    form.setFieldValue('sourceType', type.name);
  };

  return (
    <Modal
      title="Add Source"
      open={open}
      onCancel={handleCancel}
      maskClosable={false}
      confirmLoading={submitting}
      onOk={handleOk}
      okText="Save"
    >
      <Form form={form} layout="vertical" requiredMark>
        <Form.Item
          name="shortRef"
          label="Short ref"
          rules={[{ required: true, message: 'Short ref is required' }]}
        >
          <TextArea rows={2} placeholder="e.g. TSTD2" />
        </Form.Item>

        <Form.Item
          name="fullRef"
          label="Full ref"
          rules={[{ required: true, message: 'Full ref is required' }]}
        >
          <TextArea rows={5} placeholder="Full bibliographic reference" />
        </Form.Item>

        <Form.Item label="Source type" required>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              name="sourceType"
              noStyle
              rules={[{ required: true, message: 'Source type is required' }]}
            >
              <Select
                placeholder="---------"
                style={{ width: '100%' }}
                loading={loadingTypes}
                options={sourceTypes.map((t) => ({
                  value: t.name,
                  label: t.name,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Tooltip title="Add source type">
              <Button
                icon={<PlusOutlined />}
                onClick={() => setTypeModalOpen(true)}
              />
            </Tooltip>
          </Space.Compact>
        </Form.Item>
      </Form>

      <AddSourceTypeModal
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        onCreated={handleTypeCreated}
      />
    </Modal>
  );
};

export default AddSourceModal;
