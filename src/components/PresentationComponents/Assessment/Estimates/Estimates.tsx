import { useState } from 'react';

import { Grid } from '@mui/material';

import MetaTag from '@/components/MetaTag/MetaTag';

import EstimateCollapse from './EstimateCollapse';
import EstimatesNavBar from './EstimatesNavBar';
import EstimatesTabs from './EstimatesTabs';
import ShowAllSelected from './ShowAllSelected';

const Estimates = () => {
  const [viewAll, setViewAll] = useState(false);

  const handleViewAll = () => {
    setViewAll(!viewAll);
  };

  return (
    <>
      <MetaTag
        pageTitle="Estimates: Trans-Atlantic Slave Trade"
        pageDescription="Explore estimates and assessments of the Trans-Atlantic slave trade."
      />
      <EstimatesNavBar handleViewAll={handleViewAll} />
      <div className={`panel-list-unshow${viewAll ? '-show' : ''}`}>
        <ShowAllSelected setViewAll={setViewAll} ariaExpanded={false} />
      </div>
      <Grid container className={`tab-container-estimate`} spacing={4}>
        <Grid size={{ xs: 12, sm: 12, md: 4, lg: 3, xl: 3 }}>
          <EstimateCollapse />
        </Grid>
        <Grid
          size={{ xs: 12, sm: 12, md: 8, lg: 9, xl: 9 }}
          className="tab-estimate"
        >
          <EstimatesTabs />
        </Grid>
      </Grid>
    </>
  );
};

export default Estimates;
