import '@/style/contributeContent.scss';
import '@/style/newVoyages.scss';
import React from 'react';

import { Divider } from 'antd';

import { CustomLoadingOverlay } from '@/components/CommonComponts/CustomLoadingOverlay';
import { NewVoyageProps, useNewVoyage } from '@/hooks/contribute/useNewVoyage';

import { ContributionFormWrapper } from '../commons/ContributionFormWrapper';
import ContributionNavBar from '../commons/ContributionNavBar';
import PageBackHeader from '../commons/PageBackHeader';

export type { NewVoyageProps };

const NewVoyage: React.FC<NewVoyageProps> = (props) => {
  const {
    showForm,
    isLoading,
    title,
    formEntity,
    selectedContribution,
    formMode,
    contributionId,
    currentStatus,
    contributionNav,
    handleBackClick,
    handleContributionChange,
  } = useNewVoyage(props);

  if (showForm && formEntity && selectedContribution) {
    return (
      <div className="contribute-content" style={{ width: '100%' }}>
        <ContributionNavBar {...contributionNav} />
        <PageBackHeader
          title={title}
          onBack={handleBackClick}
          backTooltip="Back to Home"
        />

        <Divider style={{ margin: '12px 0' }} />
        <div
          // Dimmed while Previous / Next loads the next contribution.
          style={{
            opacity: isLoading ? 0.5 : 1,
            pointerEvents: isLoading ? 'none' : undefined,
            transition: 'opacity 0.15s',
          }}
        >
          <ContributionFormWrapper
            key={contributionId}
            entity={formEntity}
            contribution={selectedContribution}
            onChange={handleContributionChange}
            mode={formMode}
            contributionId={contributionId}
            currentStatus={currentStatus}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 200px)' }}>
        <CustomLoadingOverlay />
      </div>
    );
  }

  return null;
};

export default NewVoyage;
