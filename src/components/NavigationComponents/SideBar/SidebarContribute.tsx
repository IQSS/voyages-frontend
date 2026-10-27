import React from 'react';

import {
  ExitToApp,
  AccountCircleRounded,
  Home,
  BookOutlined,
} from '@mui/icons-material';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { useSelector } from 'react-redux';

import { useNavigation } from '@/hooks/useNavigation';
import { RootState } from '@/redux/store';
import StyledDrawer from '@/styleMUI/StyledDrawer';
import { hasEditorRole } from '@/utils/auth/hasEditorRole';
import { getDisplayButtons } from '@/utils/functions/contribuitePath';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

interface SidebarContributeProps {
  openSideBar: boolean;
}

const SidebarContribute: React.FC<SidebarContributeProps> = ({
  openSideBar,
}) => {
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const {
    handleClickGuidelines,
    handleSignInClick,
    handleLogout,
    handleClickSideBar,
  } = useNavigation();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedContribute = translationLanguagesContribute(languageValue);
  const buttons = getDisplayButtons(translatedContribute, hasEditorRole(user));

  return (
    <StyledDrawer
      variant="permanent"
      anchor="left"
      open={openSideBar}
      lang={languageValue}
    >
      <List>
        <ListItem onClick={handleClickGuidelines}>
          <Tooltip
            title={translatedContribute.contributeGuidelines}
            placement="right"
            arrow
          >
            <ListItemIcon>
              <BookOutlined style={{ cursor: 'pointer' }} />
            </ListItemIcon>
          </Tooltip>
          {openSideBar && (
            <ListItemText
              slotProps={{
                primary: {
                  style: {
                    fontSize: '0.90rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  },
                },
              }}
              primary={translatedContribute.contributeGuidelines}
            />
          )}
        </ListItem>
        {user ? (
          <>
            <ListItem onClick={() => handleClickSideBar('')}>
              <Tooltip
                title={translatedContribute.contributeContributeHome}
                placement="right"
                arrow
              >
                <ListItemIcon>
                  <Home style={{ cursor: 'pointer' }} />
                </ListItemIcon>
              </Tooltip>
              {openSideBar && (
                <ListItemText
                  slotProps={{
                    primary: {
                      style: {
                        fontSize: '0.90rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                      },
                    },
                  }}
                  primary={translatedContribute.contributeContributeHome}
                />
              )}
            </ListItem>
            {buttons.map((btn) => (
              <ListItem
                key={btn.nameBtn}
                onClick={() => handleClickSideBar(btn.path)}
              >
                <Tooltip title={btn.nameBtn} placement="right" arrow>
                  <ListItemIcon style={{ cursor: 'pointer' }}>
                    {btn.icon}
                  </ListItemIcon>
                </Tooltip>
                {openSideBar && (
                  <ListItemText
                    slotProps={{
                      primary: {
                        style: {
                          fontSize: '0.90rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                        },
                      },
                    }}
                    primary={btn.nameBtn}
                  />
                )}
              </ListItem>
            ))}

            <ListItem onClick={handleLogout}>
              <Tooltip
                title={translatedContribute.contributeLogOut}
                placement="right"
              >
                <ListItemIcon>
                  <ExitToApp style={{ cursor: 'pointer' }} />
                </ListItemIcon>
              </Tooltip>
              {openSideBar && (
                <ListItemText
                  slotProps={{
                    primary: {
                      style: {
                        fontSize: '0.90rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                      },
                    },
                  }}
                  primary={translatedContribute.contributeLogOut}
                />
              )}
            </ListItem>
          </>
        ) : (
          <ListItem onClick={handleSignInClick}>
            <Tooltip title={translatedContribute.contributeSignInButton}>
              <ListItemIcon>
                <AccountCircleRounded style={{ cursor: 'pointer' }} />
              </ListItemIcon>
            </Tooltip>
            {openSideBar && (
              <ListItemText
                slotProps={{
                  primary: {
                    style: {
                      fontSize: '0.90rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                    },
                  },
                }}
                primary={translatedContribute.contributeSignInButton}
              />
            )}
          </ListItem>
        )}
      </List>
    </StyledDrawer>
  );
};

export default SidebarContribute;
