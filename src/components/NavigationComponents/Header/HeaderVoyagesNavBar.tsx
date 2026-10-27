import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  IconButton,
  Hidden,
  Divider,
  Menu,
  Typography,
} from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { DatasetButton } from '@/components/NavigationComponents/Header/DatasetButton';
import { HeaderTitle } from '@/components/NavigationComponents/Header/HeaderTitle';
import '@/style/Nav.scss';
import ButtonDropdownColumnSelector from '@/components/SelectorComponents/ButtonComponents/ButtonDropdownColumnSelector';
import DatabaseDropdown from '@/components/SelectorComponents/DropDown/DatabaseDropdown';
import LanguagesDropdown from '@/components/SelectorComponents/DropDown/LanguagesDropdown';
import { usePageRouter } from '@/hooks/usePageRouter';
import { setCardFileName } from '@/redux/getCardFlatObjectSlice';
import {
  setBaseFilterDataSetValue,
  setBlocksMenuList,
  setDataSetHeader,
  setStyleName,
  setTableVoyagesFlatfile,
  setTextIntro,
  setVoyagesFilterMenuFlatfile,
} from '@/redux/getDataSetCollectionSlice';
import { setFilterObject } from '@/redux/getFilterSlice';
import { resetAll, resetAllStateToInitailState } from '@/redux/resetAllSlice';
import { AppDispatch, RootState } from '@/redux/store';
import {
  ALLVOYAGES,
  ALLVOYAGESPAGE,
  AllVoyagesTitle,
  INDIANOCEANANDASIANSLAVETRADEDATABASE,
  INDIANOCEANANDASIANSLAVETRADEDATABASEPAGE,
  IndianOceanAndAsiaSlaveTradesTitle,
  INTRAAMERICAN,
  INTRAAMERICANPAGE,
  IntraAmericanTitle,
  TRANSATLANTIC,
  TRANSATLANTICPAGE,
  TransAtlanticTitle,
} from '@/share/CONST_DATA';
import { CurrentPageInitialState, Filter } from '@/share/InterfaceTypes';
import {
  BaseFilter,
  BlockCollectionProps,
  DataSetCollectionProps,
} from '@/share/InterfactTypesDatasetCollection';
import { MenuListDropdownStyle } from '@/styleMUI';
import {
  getColorHoverBackground,
  getColorNavbarBackground,
  getColorBoxShadow,
  getColorBTNVoyageDatasetBackground,
} from '@/utils/functions/getColorStyle';

import { DrawerMenuBar } from './DrawerMenuBar';
import HeaderLogo from './HeaderLogo';
import GlobalSearchButton from '../../PresentationComponents/GlobalSearch/GlobalSearchButton';
import CascadingMenu from '../../SelectorComponents/Cascading/CascadingMenu';

export default function HeaderVoyagesNavBar() {
  const dispatch: AppDispatch = useDispatch();
  const { styleName: styleNameRoute } = usePageRouter();
  const navigate = useNavigate();
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );

  const { currentVoyageBlockName } = useSelector(
    (state: RootState) => state.getScrollPage as CurrentPageInitialState,
  );

  const { value, textHeader } = useSelector(
    (state: RootState) => state.getDataSetCollection,
  );

  useEffect(() => {
    if (styleNameRoute === TRANSATLANTIC) {
      dispatch(setDataSetHeader(TransAtlanticTitle));
    } else if (styleNameRoute === INTRAAMERICAN) {
      dispatch(setDataSetHeader(IntraAmericanTitle));
    } else if (styleNameRoute === ALLVOYAGES) {
      dispatch(setDataSetHeader(AllVoyagesTitle));
    } else if (styleNameRoute === INDIANOCEANANDASIANSLAVETRADEDATABASE) {
      dispatch(setDataSetHeader(IndianOceanAndAsiaSlaveTradesTitle));
    }
  }, []);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorFilterMobileEl, setAnchorFilterMobileEl] =
    useState<null | HTMLElement>(null);

  const styleNameToPathMap: { [key: string]: string } = useMemo(
    () => ({
      [ALLVOYAGES]: `${ALLVOYAGESPAGE}#${currentVoyageBlockName}`,
      [INTRAAMERICAN]: `${INTRAAMERICANPAGE}#${currentVoyageBlockName}`,
      [TRANSATLANTIC]: `${TRANSATLANTICPAGE}#${currentVoyageBlockName}`,
      [INDIANOCEANANDASIANSLAVETRADEDATABASE]: `${INDIANOCEANANDASIANSLAVETRADEDATABASEPAGE}#${currentVoyageBlockName}`,
    }),
    [currentVoyageBlockName],
  );

  const handleSelectDataset = useCallback(
    (
      base_filter: BaseFilter[],
      textHeder: string,
      textIntro: string,
      styleName: string,
      blocks: BlockCollectionProps[],
      filterMenuFlatfile?: string,
      tableFlatfile?: string,
      card_flatfile?: string,
    ) => {
      dispatch(resetAll());
      const filters: Filter[] = [];

      for (const base of base_filter) {
        filters.push({
          varName: base.var_name,
          searchTerm: base.value,
          op: 'in',
        });
      }
      const filteredFilters = filters.filter(
        (filter) =>
          !Array.isArray(filter.searchTerm) || filter.searchTerm.length > 0,
      );
      dispatch(setBaseFilterDataSetValue(base_filter));
      dispatch(setFilterObject(filteredFilters));
      dispatch(setDataSetHeader(textHeder));
      dispatch(setTextIntro(textIntro));
      dispatch(setStyleName(styleName));
      dispatch(setBlocksMenuList(blocks));

      if (filterMenuFlatfile) {
        dispatch(setVoyagesFilterMenuFlatfile(filterMenuFlatfile));
      }
      if (tableFlatfile) {
        dispatch(setTableVoyagesFlatfile(tableFlatfile));
      }
      if (card_flatfile) {
        dispatch(setCardFileName(card_flatfile));
      }
      const filterObjectUpdate = {
        filter: filters,
      };
      // Save to LocalStorage
      localStorage.setItem('filterObject', JSON.stringify(filterObjectUpdate));

      // Navigate after state updates
      if (styleName === ALLVOYAGES && currentVoyageBlockName === 'timelapse') {
        navigate(`${ALLVOYAGESPAGE}#voyages`);
      } else if (styleNameToPathMap[styleName]) {
        navigate(styleNameToPathMap[styleName]);
      }

      // Cleanup LocalStorage (only remove specific keys if needed)
      const keysToRemove = Object.keys(localStorage);
      keysToRemove.forEach((key) => {
        if (key !== 'filterObject') {
          localStorage.removeItem(key);
        }
      });
    },
    [currentVoyageBlockName, navigate, dispatch, styleNameToPathMap],
  );

  const handleMenuFilterMobileClose = () => {
    setAnchorFilterMobileEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuOpen: MouseEventHandler<HTMLButtonElement> = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const onClickReset = () => {
    dispatch(resetAllStateToInitailState());
    const keysToRemove = Object.keys(localStorage);
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
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
          backgroundColor: getColorNavbarBackground(styleNameRoute!),
          paddingTop: 5,
          zIndex: 5,
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center' }}>
          <Hidden mdUp>
            <IconButton
              edge="start"
              color="default"
              aria-label="menu"
              onClick={handleMenuOpen}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon style={{ color: 'fff' }} />
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
            <span className="header-logo-icon">
              <HeaderLogo />
              <DatabaseDropdown onClickReset={onClickReset} />
              <HeaderTitle textHeader={textHeader} />
            </span>
            <Typography
              component="div"
              variant="body1"
              fontWeight="500"
              sx={{
                alignItems: 'center',
                display: {
                  xs: 'none',
                  sm: 'none',
                  md: 'flex',
                  paddingRight: 60,
                },
                margin: '6px 0',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {inputSearchValue && <GlobalSearchButton />}
            </Typography>
          </Typography>
          <Hidden mdUp>{!inputSearchValue && <CascadingMenu />}</Hidden>
          <Box
            className="menu-nav-bar-select-box"
            sx={{
              display: {
                xs: 'none',
                sm: 'none',
                md: 'flex',
                lg: 'flex',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 600,
              },
            }}
          >
            {value.map((item: DataSetCollectionProps, index: number) => {
              return (
                <DatasetButton
                  key={`${item.style_name}-${index}`}
                  item={item}
                  index={index}
                  handleSelectDataset={handleSelectDataset}
                  getColorBoxShadow={getColorBoxShadow}
                  getColorBTNBackground={getColorBTNVoyageDatasetBackground}
                  getColorHover={getColorHoverBackground}
                />
              );
            })}
            <LanguagesDropdown />
          </Box>
        </Toolbar>
        <Divider
          sx={{
            borderWidth: '0.25px',
            borderClor: 'rgb(0 0 0 / 50%)',
          }}
        />
        <Hidden mdDown>{!inputSearchValue && <CascadingMenu />}</Hidden>
        <Box component="nav">
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClick={handleMenuClose}
            disableScrollLock={true}
          >
            <DrawerMenuBar
              value={value}
              handleSelectDataset={handleSelectDataset}
            />
          </Menu>
        </Box>
      </AppBar>
      <Menu
        anchorEl={anchorFilterMobileEl}
        open={Boolean(anchorFilterMobileEl)}
        onClick={handleMenuFilterMobileClose}
        disableScrollLock={true}
      >
        <MenuListDropdownStyle>
          <ButtonDropdownColumnSelector />
        </MenuListDropdownStyle>
      </Menu>
    </Box>
  );
}
