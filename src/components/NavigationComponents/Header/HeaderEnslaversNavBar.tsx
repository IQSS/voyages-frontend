import { MouseEventHandler, useEffect, useState, useCallback } from 'react';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Divider,
  IconButton,
  Menu,
  Typography,
} from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import { useDispatch, useSelector } from 'react-redux';
import '@/style/Nav.scss';
import { useNavigate } from 'react-router-dom';

import { HeaderTitle } from '@/components/NavigationComponents/Header/HeaderTitle';
import GlobalSearchButton from '@/components/PresentationComponents/GlobalSearch/GlobalSearchButton';
import ButtonDropdownColumnSelector from '@/components/SelectorComponents/ButtonComponents/ButtonDropdownColumnSelector';
import CascadingMenu from '@/components/SelectorComponents/Cascading/CascadingMenu';
import DatabaseDropdown from '@/components/SelectorComponents/DropDown/DatabaseDropdown';
import LanguagesDropdown from '@/components/SelectorComponents/DropDown/LanguagesDropdown';
import { usePageRouter } from '@/hooks/usePageRouter';
import { setCardFileName } from '@/redux/getCardFlatObjectSlice';
import { setFilterObject } from '@/redux/getFilterSlice';
import {
  setBaseFilterEnslaversDataSetValue,
  setDataSetEnslaversHeader,
  setEnslaversBlocksMenuList,
  setEnslaversFilterMenuFlatfile,
  setEnslaversStyleName,
  setPeopleTableEnslavedFlatfile,
} from '@/redux/getPeopleEnslaversDataSetCollectionSlice';
import { resetAll, resetAllStateToInitailState } from '@/redux/resetAllSlice';
import { resetBlockNameAndPageName } from '@/redux/resetBlockNameAndPageName';
import { AppDispatch, RootState } from '@/redux/store';
import {
  ALLENSLAVERS,
  ENSALVERSTYLE,
  EnslaversAllTrades,
  INTRAAMERICANENSLAVERS,
  INTRAAMERICANTRADS,
  IntraAmericanTitle,
  TRANSATLANTICENSLAVERS,
  TRANSATLANTICTRADS,
  TransAtlanticTitle,
  allEnslavers,
} from '@/share/CONST_DATA';
import { Filter } from '@/share/InterfaceTypes';
import {
  BaseFilter,
  BlockCollectionProps,
  DataSetCollectionProps,
} from '@/share/InterfactTypesDatasetCollection';
import { MenuListDropdownStyle } from '@/styleMUI';
import {
  getColorBTNVoyageDatasetBackground,
  getColorBoxShadow,
  getColorHoverBackground,
  getColorNavbarBackground,
} from '@/utils/functions/getColorStyle';

import { DatasetButton } from './DatasetButton';
import { DrawerMenuBar } from './DrawerMenuBar';
import HeaderLogo from './HeaderLogo';
import { clearSavedData } from '@/utils/supabase/authStorage';

const HeaderEnslaversNavBar: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { value, textHeader } = useSelector(
    (state: RootState) => state.getEnslaverDataSetCollections,
  );
  const { currentBlockName } = useSelector(
    (state: RootState) => state.getScrollEnslaversPage,
  );

  const { styleName: styleNameRoute } = usePageRouter();
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );

  const [anchorFilterMobileEl, setAnchorFilterMobileEl] =
    useState<null | HTMLElement>(null);

  useEffect(() => {
    if (styleNameRoute === TRANSATLANTICTRADS) {
      dispatch(setDataSetEnslaversHeader(TransAtlanticTitle));
    } else if (styleNameRoute === INTRAAMERICANTRADS) {
      dispatch(setDataSetEnslaversHeader(IntraAmericanTitle));
    } else if (styleNameRoute === ENSALVERSTYLE) {
      dispatch(setDataSetEnslaversHeader(EnslaversAllTrades));
    }
  }, [dispatch, styleNameRoute]);

  const handleMenuFilterMobileClose = () => {
    setAnchorFilterMobileEl(null);
  };

  const onClickResetOnHeader = () => {
    dispatch(resetAll());
    dispatch(resetBlockNameAndPageName());
    dispatch(resetAllStateToInitailState());
    clearSavedData();
  };

  const handleSelectEnslaversDataset = useCallback(
    (
      baseFilter: BaseFilter[],
      textHeder: string,
      textIntro: string,
      styleName: string,
      blocks: BlockCollectionProps[],
      filterMenuFlatfile?: string,
      tableFlatfile?: string,
      cardFlatfile?: string,
    ) => {
      dispatch(resetAll());
      const filters: Filter[] = [];
      for (const base of baseFilter) {
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

      dispatch(setBaseFilterEnslaversDataSetValue(baseFilter));
      dispatch(setFilterObject(filteredFilters));
      dispatch(setDataSetEnslaversHeader(textHeder));
      dispatch(setEnslaversStyleName(styleName));
      dispatch(setEnslaversBlocksMenuList(blocks));
      dispatch(setEnslaversFilterMenuFlatfile(filterMenuFlatfile || ''));
      dispatch(setPeopleTableEnslavedFlatfile(tableFlatfile || ''));
      dispatch(setCardFileName(cardFlatfile || ''));

      localStorage.setItem(
        'filterObject',
        JSON.stringify({ filter: filteredFilters }),
      );

      const styleNameToPathMap: { [key: string]: string } = {
        [allEnslavers]: `${ALLENSLAVERS}/${allEnslavers}#${currentBlockName}`,
        [INTRAAMERICANTRADS]: `${ALLENSLAVERS}${INTRAAMERICANENSLAVERS}#${currentBlockName}`,
        [TRANSATLANTICTRADS]: `${ALLENSLAVERS}${TRANSATLANTICENSLAVERS}#${currentBlockName}`,
      };
      if (styleNameToPathMap[styleName])
        navigate(styleNameToPathMap[styleName]);
      clearSavedData(['filterObject']);
    },
    [navigate, dispatch, currentBlockName],
  );

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuOpen: MouseEventHandler<HTMLButtonElement> = (event) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      <AppBar
        component="nav"
        className="nav-enslavers"
        style={{
          backgroundColor: getColorNavbarBackground(styleNameRoute!),
          paddingTop: 5,
          zIndex: 5,
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
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
              <DatabaseDropdown onClickReset={onClickResetOnHeader} />
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
                  paddingRight: 40,
                },
                margin: '10px 0',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {inputSearchValue && <GlobalSearchButton />}
            </Typography>
          </Typography>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>{!inputSearchValue && <CascadingMenu />}</Box>
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
            {value.map((item: DataSetCollectionProps, index: number) => (
              <DatasetButton
                key={`${item.style_name}-${index}`}
                item={item}
                index={index}
                handleSelectDataset={handleSelectEnslaversDataset}
                getColorBoxShadow={getColorBoxShadow}
                getColorBTNBackground={getColorBTNVoyageDatasetBackground}
                getColorHover={getColorHoverBackground}
              />
            ))}
            <LanguagesDropdown />
          </Box>
        </Toolbar>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>
          <Divider
            sx={{
              borderWidth: '0.25px',
              borderClor: 'rgb(0 0 0 / 50%)',
            }}
          />
          {!inputSearchValue && <CascadingMenu />}
        </Box>
        <Box component="nav">
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClick={handleMenuClose}
            disableScrollLock={true}
          >
            <DrawerMenuBar
              value={value}
              handleSelectDataset={handleSelectEnslaversDataset}
            />
          </Menu>
        </Box>
      </AppBar>
      <Menu
        disableScrollLock={true}
        anchorEl={anchorFilterMobileEl}
        open={Boolean(anchorFilterMobileEl)}
        onClick={handleMenuFilterMobileClose}
      >
        <MenuListDropdownStyle>
          <ButtonDropdownColumnSelector />
        </MenuListDropdownStyle>
      </Menu>
    </Box>
  );
};

export default HeaderEnslaversNavBar;
