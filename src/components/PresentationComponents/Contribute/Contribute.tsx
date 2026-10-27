import React, { useState } from 'react';

import { useLocation } from 'react-router-dom';

import SidebarContribute from '@/components/NavigationComponents/SideBar/SidebarContribute';

import ContributeContent from './ContributeContent';
import ContributeNavBar from './ContributeNavBar';
import '@/style/contributeContent.scss';

const Contribute: React.FC = () => {
  const [openSideBar, setOpenSideBar] = useState(false);
  const handleDrawerOpen = () => setOpenSideBar(!openSideBar);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  return (
    <>
      <ContributeNavBar
        handleDrawerOpen={handleDrawerOpen}
        isAdminRoute={isAdminRoute}
      />
      {isAdminRoute ? (
        <div className="admin-main-content">
          <SidebarContribute openSideBar={openSideBar} />
          <ContributeContent openSideBar={openSideBar} />
        </div>
      ) : (
        <div className="contribuite-main-content">
          <SidebarContribute openSideBar={openSideBar} />
          <ContributeContent openSideBar={openSideBar} />
        </div>
      )}
    </>
  );
};

export default Contribute;
