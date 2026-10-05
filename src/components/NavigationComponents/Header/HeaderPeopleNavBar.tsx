import { MouseEventHandler, useState } from 'react';
import { AppBar, Box, IconButton, Hidden, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import { Button, Menu } from '@mui/material';
import PEOPLE from '@/utils/flatfiles/people/people_page_data.json';
import { useNavigate } from 'react-router-dom';
import '@/style/Nav.scss';
import {
  ALLENSLAVERS,
  ENSALVEDPAGE,
  ENSALVERSPAGE,
  TRANSATLANTICENSLAVERS,
  AFRICANORIGINSPAGE,
  AFRICANORIGINS,
} from '@/share/CONST_DATA';
import { setCurrentEnslavedPage } from '@/redux/getScrollEnslavedPageSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setCurrentEnslaversPage } from '@/redux/getScrollEnslaversPageSlice';
import {
  setPathEnslavers,
  setPathNameEnslaved,
} from '@/redux/getDataPathNameSlice';
import { resetAllStateToInitailState } from '@/redux/resetAllSlice';
import HeaderLogo from './HeaderLogo';
import LanguagesDropdown from '@/components/SelectorComponents/DropDown/LanguagesDropdown';
import { LabelFilterMeneList } from '@/share/InterfaceTypes';
import { HeaderDrawerMenuPeopleBar } from './HeaderDrawerMenuPeopleBar';

export default function HeaderPeopleNavBar() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch: AppDispatch = useDispatch();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages
  );
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuOpen: MouseEventHandler<HTMLButtonElement> = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSelectMenuItems = (item: string) => {
    dispatch(resetAllStateToInitailState());
    const keysToRemove = Object.keys(localStorage);
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
    if (
      item === 'Enslaved' ||
      item === 'Esclavizados' ||
      item === 'Escravizados'
    ) {
      navigate(`${ENSALVEDPAGE}${AFRICANORIGINSPAGE}#people`);
      dispatch(setCurrentEnslavedPage(1));
      dispatch(setPathNameEnslaved(AFRICANORIGINS));
    } else if (
      item === 'Slave Traders' ||
      item === 'Traficantes de Esclavos' ||
      item === 'Traficantes de Escravos'
    ) {
      navigate(`${ENSALVERSPAGE}${TRANSATLANTICENSLAVERS}#people`);
      dispatch(setCurrentEnslaversPage(1));
      dispatch(setPathEnslavers(ALLENSLAVERS));
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      <AppBar
        component="nav"
        style={{
          backgroundColor: '#ffffff',
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center' }}>
          <Hidden mdUp>
            <IconButton
              edge="start"
              aria-label="menu"
              onClick={handleMenuOpen}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Hidden>
          <Typography
            component="div"
            sx={{
              flexGrow: 1,
              width: { xs: 200, sm: 220 },
              fontWeight: { sm: 600, md: 500 },
            }}
          >
            <span className="header-logo-icon-people">
              <HeaderLogo />
              {PEOPLE.map((item, index) => {
                const { title } = item;
                const textHeaderTitle = (title.label as LabelFilterMeneList)[
                  languageValue
                ];
                return (
                  <div
                    className="people-header"
                    key={`${index}-${textHeaderTitle}`}
                  >
                    {textHeaderTitle}
                  </div>
                );
              })}
            </span>
          </Typography>
          <Box
            className="menu-nav-bar-select-box"
            sx={{
              display: {
                xs: 'none',
                sm: 'none',
                md: 'flex',
                lg: 'flex',
                textAlign: 'center',
                alignItems: 'center',
                paddingRight: 40,
                fontWeight: 600,
                fontSize: 20,
              },
            }}
          >
            {PEOPLE.map((items) =>
              items.header.map((title, index) => {
                const { label: textLabel } = title;
                const textTitle = (textLabel as LabelFilterMeneList)[
                  languageValue
                ];
                return (
                  <Button
                    onClick={() => handleSelectMenuItems(textTitle)}
                    key={`${textTitle}-${index}`}
                    sx={{
                      color: 'rgba(0, 0, 0, 0.85)',
                      fontWeight: 600,
                      fontSize: '1.15rem',
                      margin: '0 2px',
                      textTransform: 'none',
                    }}
                  >
                    <div>{textTitle}</div>
                  </Button>
                );
              })
            )}
            <LanguagesDropdown />
          </Box>
        </Toolbar>
        <Box component="nav">
          <Menu
            disableScrollLock={true}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClick={handleMenuClose}
          >
            <HeaderDrawerMenuPeopleBar
              value={PEOPLE[0]}
              handleSelectMenuItems={handleSelectMenuItems}
            />
          </Menu>
        </Box>
      </AppBar>
    </Box>
  );
}
