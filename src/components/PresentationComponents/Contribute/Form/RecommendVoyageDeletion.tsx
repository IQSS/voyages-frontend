import '@/style/contributeContent.scss';
import { useState } from 'react';

import {
  Contribution,
  ContributionStatus,
  EntityDelete,
  MaterializedEntity,
} from '@slavevoyages/voyages-contribute';
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Modal,
  message,
  Descriptions,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { isAxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { createSaveChangeContribution } from '@/fetch/contributeFetch/createSaveChangeContribution';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';
import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';
import { RootState } from '@/redux/store';
import { describeAuthFailure } from '@/utils/contribute/authErrors';
import {
  checkVoyageConflict,
  getConflictErrorMessage,
} from '@/utils/functions/voyageValidation';

interface DeletionFormValues {
  voyageId: string;
  notes: string;
}

const RecommendVoyageDeletion: React.FC = () => {
  const [form] = Form.useForm<DeletionFormValues>();
  const [entity, setEntity] = useState<MaterializedEntity | undefined>();
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);

  /**
   * Look the voyage up before offering to delete it, so the reviewer can see
   * which record they are about to remove rather than trusting an id they typed.
   */
  const handleSearch = async () => {
    const voyageId = form.getFieldValue('voyageId');
    if (!voyageId) {
      message.warning('Please enter a voyage ID');
      return;
    }
    setSearching(true);
    setEntity(undefined);
    try {
      // A voyage already under review must not collect a second, conflicting
      // contribution on top of it.
      const conflict = await checkVoyageConflict(voyageId, 'existing');
      if (conflict.hasConflict && conflict.status !== undefined) {
        const { content } = getConflictErrorMessage(conflict.status);
        Modal.warning({
          title: `Voyage ${voyageId} already has a contribution under review.`,
          content,
          okText: 'OK',
        });
        return;
      }

      const res = await fetchSubmitEditVoaygesForm(voyageId);
      if (res.status === 200 && res.data) {
        setEntity(res.data);
      } else {
        message.error(`Voyage ${voyageId} was not found.`);
      }
    } catch (error) {
      // A raw "Request failed with status code 500" tells the reviewer nothing
      // they can act on, so name the cases they can actually distinguish.
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const authFailure = describeAuthFailure(error);
      if (status === 404) {
        message.error(`Voyage ${voyageId} was not found.`);
      } else if (authFailure) {
        // Otherwise a dead session reads as a dead voyage service.
        message.error(authFailure.message);
        console.error('Voyage lookup refused:', error);
      } else {
        message.error(
          `Could not look up voyage ${voyageId}. The voyage service may be unavailable — try again, or contact an administrator if it persists.`,
        );
        console.error('Voyage lookup failed:', error);
      }
    } finally {
      setSearching(false);
    }
  };

  /**
   * A deletion is not a special kind of request — it is an ordinary
   * contribution whose change set holds a single delete against the voyage.
   * An editor reviews and accepts it like any other.
   */
  const submitDeletion = async (notes: string) => {
    if (!entity) {
      return;
    }
    setSubmitting(true);
    try {
      const deletion: EntityDelete = {
        type: 'delete',
        entityRef: entity.entityRef,
      };
      const contribution: Contribution = {
        id: uuidv4(),
        root: entity.entityRef,
        changeSet: {
          id: uuidv4(),
          author: user?.email || '',
          title: 'Recommend deletion',
          comments: notes,
          timestamp: Date.now(),
          changes: [deletion],
        },
        status: ContributionStatus.WorkInProgress,
        reviews: [],
        media: [],
      };

      const created = await createSaveChangeContribution(contribution);
      // The create endpoint forces Work In Progress regardless of what we send,
      // so move it to Submitted explicitly — otherwise the recommendation sits
      // in the contributor's drafts and no editor ever sees it.
      await updateContributionStatus(
        created.id ?? contribution.id,
        ContributionStatus.Submitted,
      );

      message.success(
        'Deletion recommended — an editor will review it. Nothing has been removed yet.',
      );
      form.resetFields();
      setEntity(undefined);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Could not submit the deletion recommendation';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (values: DeletionFormValues) => {
    if (!entity) {
      message.warning('Search for a voyage first.');
      return;
    }
    Modal.confirm({
      title: 'Recommend this voyage for deletion?',
      content: `Voyage ${values.voyageId} will be sent to an editor for review. It is not removed until the editor accepts.`,
      okText: 'Recommend deletion',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => submitDeletion(values.notes),
    });
  };

  return (
    <div className="contribute-content">
      <h1 className="page-title-1">
        Recommend the Deletion of an Existing Voyage
      </h1>
      <div className="content-inner-wrapper">
        <p>
          Please use the box for notes to tell us why the selected voyage(s)
          should be removed from the database.
        </p>
        <Form layout="horizontal" form={form} onFinish={handleSubmit}>
          <Row gutter={12} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Form.Item
                label="Voyage ID:"
                style={{ flex: 1, marginBottom: 0 }}
                name="voyageId"
                rules={[{ required: true, message: 'Please input Voyage ID!' }]}
              >
                <Input
                  placeholder="Enter Voyage ID"
                  type="number"
                  width={320}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                ghost
                loading={searching}
                style={{
                  marginLeft: 10,
                  height: 32,
                  borderColor: 'rgb(55, 148, 141)',
                  color: 'rgb(55, 148, 141)',
                }}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Col>
          </Row>

          {entity && (
            <Descriptions
              size="small"
              bordered
              column={1}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Voyage ID">
                {String(entity.entityRef.id)}
              </Descriptions.Item>
              <Descriptions.Item label="Vessel">
                {String(
                  (entity.data?.Ship as MaterializedEntity | undefined)?.data?.[
                    'Name of vessel'
                  ] ?? '—',
                )}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Form.Item
            label="Notes:"
            style={{ flex: 1, marginBottom: 0 }}
            name="notes"
            rules={[
              {
                required: true,
                message: 'Please explain why this voyage should be removed',
              },
            ]}
          >
            <TextArea placeholder="Notes" rows={3} />
          </Form.Item>
          <Form.Item style={{ paddingLeft: 60 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={!entity}
              style={{
                backgroundColor: entity ? 'rgb(55, 148, 141)' : undefined,
                height: 32,
                marginTop: 10,
              }}
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
export default RecommendVoyageDeletion;
