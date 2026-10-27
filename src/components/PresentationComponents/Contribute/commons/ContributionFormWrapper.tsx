import React from 'react';

import {
  Contribution,
  ContributionStatus,
  MaterializedEntity,
} from '@slavevoyages/voyages-contribute';
import { Button, Divider, Form, Input } from 'antd';

import { ContributionForm, ReviewMode } from '../ContributionForm';
import { TransformedContribution } from '../utils/transformContributionData';

interface ContributionFormWrapperProps {
  /** Title to display at the top of the form */
  title?: string;
  /** Whether to show the back button */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Custom text for the back button (default: "← Back to Table") */
  backButtonText?: string;
  /** The materialized entity to edit */
  entity: MaterializedEntity;
  /** The contribution object */
  contribution: Contribution | TransformedContribution;
  /** Callback when contribution changes */
  onChange: (contribution: Contribution | TransformedContribution) => void;
  /** Form mode: Create or Edit */
  mode: ReviewMode;
  /** Optional contribution ID */
  contributionId?: string;
  /** Current status of the contribution */
  currentStatus?: ContributionStatus;
  /** Whether to show voyage comments section */
  showVoyageComments?: boolean;
  /** Form instance for voyage comments */
  form?: any;
}

/**
 * Shared wrapper component for voyage contribution forms
 * Used by both NewVoyage and EditExistingVoyage components
 */
export const ContributionFormWrapper: React.FC<
  ContributionFormWrapperProps
> = ({
  title,
  showBackButton = false,
  onBack,
  backButtonText = '← Back to Table',
  entity,
  contribution,
  onChange,
  mode,
  contributionId,
  currentStatus,
}) => {
  return (
    <div className="contribute-content" style={{ width: '100%' }}>
      {showBackButton && onBack && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <Button onClick={onBack} style={{ height: '32px' }}>
            {backButtonText}
          </Button>
        </div>
      )}
      <ContributionForm
        title={title}
        entity={entity}
        contribution={contribution}
        onChange={onChange}
        mode={mode}
        contributionId={contributionId}
        currentStatus={currentStatus}
      />
    </div>
  );
};
