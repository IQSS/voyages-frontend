import '@/style/contributeContent.scss';
import '@/style/newVoyages.scss';
import { useCallback, useState } from 'react';

import {
  MaterializedEntity,
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';
import { Form, Input, Button, Divider, Modal, message } from 'antd';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import LOADINGLOGO from '@/assets/sv-logo_v2_notext.svg';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';
import { RootState } from '@/redux/store';
import { describeAuthFailure } from '@/utils/contribute/authErrors';
import {
  checkVoyageConflict,
  getConflictErrorMessage,
} from '@/utils/functions/voyageValidation';

import { ContributionFormWrapper } from '../commons/ContributionFormWrapper';
import { ReviewMode } from '../ContributionForm';
import { TransformedContribution } from '../utils/transformContributionData';

interface EditExistingVoyageProps {
  openSideBar: boolean;
}
const EditExistingVoyage: React.FC<EditExistingVoyageProps> = ({
  openSideBar,
}) => {
  const [formId] = Form.useForm();
  const [entity, setEntity] = useState<MaterializedEntity | undefined>(
    undefined,
  );
  const [contribution, setContribution] = useState<
    Contribution | TransformedContribution | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);

  const handleSubmit = async (values: any): Promise<void> => {
    const voyageId = values.voyageId;

    if (voyageId) {
      setLoading(true);
      // Put the previous voyage away before fetching the next one. Held on to,
      // it keeps its form on screen for the whole request -- so a search looks
      // like it did nothing until the moment the new record lands, and a slow
      // one looks like a record that refused to change.
      setEntity(undefined);
      setContribution(undefined);

      try {
        // Check if this voyage already has a pending or submitted contribution
        const conflict = await checkVoyageConflict(voyageId, 'existing');

        if (conflict.hasConflict && conflict.status !== undefined) {
          const { content } = getConflictErrorMessage(conflict.status);
          Modal.warning({
            title: `Voyage ID ${voyageId} already has an open contribution.`,
            content,
            okText: 'OK',
          });
          setLoading(false);
          return;
        }

        // Fetch the voyage entity
        const res = await fetchSubmitEditVoaygesForm(voyageId);
        if (res.status === 200) {
          const fetchedEntity = res.data;
          setEntity(fetchedEntity);

          // Create a new contribution for editing this existing voyage
          const newContribution: Contribution = {
            id: uuidv4(),
            root: fetchedEntity.entityRef,
            changeSet: {
              id: uuidv4(),
              author: user?.email || '',
              title: '',
              comments: '',
              timestamp: new Date().getTime(),
              changes: [],
            },
            status: ContributionStatus.WorkInProgress,
            reviews: [],
            media: [],
          };
          setContribution(newContribution);
          setLoading(false);
        } else {
          message.error('Voyage not found or error on API');
          setLoading(false);
        }
      } catch (error) {
        // An expired session fails this search the same way a broken search
        // does, and the old message named the search — which sent people to
        // look for a fault in a lookup that was working fine.
        const authFailure = describeAuthFailure(error);
        console.error('Error checking for existing contributions:', error);
        message.error(
          authFailure?.message ?? 'Error checking for existing contributions',
        );
        setLoading(false);
      }
    } else {
      message.warning('Please enter a voyage ID');
      setLoading(false);
    }
  };

  const handleContributionChange = useCallback(
    (updatedContribution: Contribution | TransformedContribution) => {
      setContribution(updatedContribution);
    },
    [],
  );

  return (
    <div
      className="contribute-content"
      style={{ width: openSideBar ? '75vw' : '90vw' }}
    >
      <h1 className="page-title-1">Edit an Existing Record of a Voyage</h1>
      <div className="content-inner-wrapper">
        <p className="description-text">
          Please select the voyage you wish to edit.
        </p>
        <Form layout="vertical" form={formId} onFinish={handleSubmit}>
          <div
            style={{
              display: 'flex',
              alignItems: 'start',
              marginBottom: 10,
              width: 320,
            }}
          >
            <Form.Item
              style={{ flex: 1, marginBottom: 0 }}
              name="voyageId"
              rules={[{ required: true, message: 'Please input Voyage ID!' }]}
            >
              <Input placeholder="Enter Voyage ID" type="number" />
            </Form.Item>
            <Button
              type="primary"
              ghost
              style={{
                marginLeft: 10,
                height: 32,
                borderColor: 'rgb(55, 148, 141)',
                color: 'rgb(55, 148, 141)',
              }}
              onClick={() => formId.submit()}
            >
              Search
            </Button>
          </div>
        </Form>
        <Divider />
        {entity && contribution ? (
          <ContributionFormWrapper
            // Searching a different voyage is a different form, not the same
            // form with new props. Without a key React keeps the instance, and
            // everything the form holds itself -- the values in its fields, the
            // panels left open, the changes tracked against the last voyage --
            // survives into a record it was never about. The data arrives; the
            // form is what does not move.
            key={String(entity.entityRef.id)}
            entity={entity}
            contribution={contribution}
            contributionId={contribution.id}
            onChange={handleContributionChange}
            mode={ReviewMode.Edit}
            currentStatus={ContributionStatus.WorkInProgress}
          />
        ) : (
          <div
            style={{
              height: '50vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              border: '1px dashed #ccc',
              borderRadius: '8px',
              marginTop: '20px',
              backgroundColor: '#f9f9f9',
            }}
          >
            {loading ? (
              <div className="loading-logo">
                <img src={LOADINGLOGO} alt="loading" style={{ width: '50%' }} />
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '24px',
                    color: '#999',
                    marginBottom: '10px',
                  }}
                >
                  ✏️
                </div>
                <div style={{ fontSize: '16px', color: '#666' }}>
                  Please enter a Voyage ID and click <strong>Search</strong> to
                  start editing.
                </div>
              </>
            )}
          </div>
        )}
        <Divider />
      </div>
    </div>
  );
};

export default EditExistingVoyage;
