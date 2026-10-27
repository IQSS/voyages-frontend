import { useEffect, useMemo, useState, useCallback } from 'react';

import {
  CaretDownOutlined,
  QuestionCircleOutlined,
  CheckOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { usePageRouter } from '@/hooks/usePageRouter';
import { setVisibleColumn } from '@/redux/getColumnSlice';
import { AppDispatch, RootState } from '@/redux/store';
import {
  ENSALVERSTYLE,
  INDIANOCEANANDASIANTRANDS,
  INTRAAMERICANTRADS,
  TRANSATLANTICTRADS,
} from '@/share/CONST_DATA';
import {
  LabelFilterMeneList,
  TYPESOFDATASET,
  TYPESOFDATASETPEOPLE,
} from '@/share/InterfaceTypes';
import {
  ColumnSelectorTree,
  TableCellStructureInitialStateProp,
} from '@/share/InterfaceTypesTable';
import AFRICANORIGINS_TABLE from '@/utils/flatfiles/enslaved/enslaved_african_origins_table.json';
import ENSLAVED_TABLE from '@/utils/flatfiles/enslaved/enslaved_all_table.json';
import TEXAS_TABLE from '@/utils/flatfiles/enslaved/enslaved_texas_table.json';
import ENSLAVERS_TABLE from '@/utils/flatfiles/enslavers/enslavers_table.json';
import AllVoyages_TABLE_FLAT from '@/utils/flatfiles/voyages/voyages_all_table.json';
import INDIANOCEANANDASIANFILE_TABLE_FLAT from '@/utils/flatfiles/voyages/voyages_indian_ocean_and_asia_slave_trade_database_table.json';
import Intraamerican_TABLE_FLAT from '@/utils/flatfiles/voyages/voyages_intraamerican_table.json';
import Transatlantic_TABLE_FLAT from '@/utils/flatfiles/voyages/voyages_transatlantic_table.json';
import { checkRouteForVoyages } from '@/utils/functions/checkPagesRoute';
import {
  getColorBTNVoyageDatasetBackground,
  getColorBoxShadow,
  getColorHoverBackground,
} from '@/utils/functions/getColorStyle';
import { translationHomepage } from '@/utils/functions/translationLanguages';

// Move JSON parsing outside component to avoid re-creating on every render
const transatlanticColumnSelector: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(Transatlantic_TABLE_FLAT.column_selector_tree),
);
const intraamericanColumnSelector: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(Intraamerican_TABLE_FLAT.column_selector_tree),
);
const allVoyageColumnSelector: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(AllVoyages_TABLE_FLAT.column_selector_tree),
);
const indianOceanAsiaSlaveTrades: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(INDIANOCEANANDASIANFILE_TABLE_FLAT.column_selector_tree),
);
const enslavedColumnSelector: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(ENSLAVED_TABLE.column_selector_tree),
);
const africanOriginsColumnSelector: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(AFRICANORIGINS_TABLE.column_selector_tree),
);
const texasColumnSelector: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(TEXAS_TABLE.column_selector_tree),
);
const enslaversColumnSelector: ColumnSelectorTree[] = JSON.parse(
  JSON.stringify(ENSLAVERS_TABLE.column_selector_tree),
);

// Global styles for column selector component
const COLUMN_SELECTOR_STYLES = `
  .ant-dropdown-menu-submenu-arrow {
    display: none !important;
  }
  .ant-dropdown-menu-item:hover {
    background-color: #f5f5f5 !important;
  }
  .column-selector-tooltip .ant-tooltip-inner {
    max-width: 300px;
    text-align: left;
  }
`;

// Badge style for visible column count
const BADGE_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.2)',
  borderRadius: '10px',
  padding: '2px 6px',
  fontSize: '0.7rem',
  minWidth: '20px',
  textAlign: 'center' as const,
};

const ButtonDropdownColumnSelector = () => {
  const dispatch: AppDispatch = useDispatch();
  const { styleName: styleNameRoute } = usePageRouter();
  const { visibleColumnCells } = useSelector(
    (state: RootState) =>
      state.getColumns as TableCellStructureInitialStateProp,
  );
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const [menuValueCells, setMenuValueCells] = useState<ColumnSelectorTree[]>(
    [],
  );
  const translatedHomepage = translationHomepage(languageValue);

  // Updated handleColumnVisibilityChange to work with Ant Design menu
  const handleColumnVisibilityChange = useCallback(
    (colID: string) => {
      if (colID) {
        // Get current column state from localStorage if it exists
        let currentOrder: string[] = [];
        try {
          const savedState = localStorage.getItem('columnState');
          if (savedState) {
            const parsedState = JSON.parse(savedState) as Array<{
              colId: string;
            }>;
            currentOrder = parsedState.map((col) => col.colId);
          }
        } catch (error) {
          console.error('Error parsing column state:', error);
        }

        let updatedVisibleColumns: string[];

        if (visibleColumnCells.includes(colID)) {
          updatedVisibleColumns = visibleColumnCells.filter(
            (column: string) => column !== colID,
          );

          if (updatedVisibleColumns.length === 0) {
            console.warn(
              'Cannot hide all columns. Keeping at least one visible.',
            );
            return;
          }
        } else {
          // Add column - maintain the relative position if it was in the saved order
          updatedVisibleColumns = [...visibleColumnCells, colID];

          // If we have a saved order and the column was previously in it,
          // sort the visible columns according to that order
          if (currentOrder.length > 0) {
            updatedVisibleColumns.sort((a, b) => {
              const indexA = currentOrder.indexOf(a);
              const indexB = currentOrder.indexOf(b);

              // If neither is in the saved order, maintain current order
              if (indexA === -1 && indexB === -1) return 0;

              // If only one is in the saved order, put it first
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;

              // Otherwise, use the saved ordering
              return indexA - indexB;
            });
          }
        }

        // Dispatch the updated visible columns
        dispatch(setVisibleColumn(updatedVisibleColumns));

        // Save to localStorage
        localStorage.setItem(
          'visibleColumns',
          JSON.stringify(updatedVisibleColumns),
        );
      }
    },
    [visibleColumnCells, dispatch],
  );

  useEffect(() => {
    const loadMenuValueCellStructure = async () => {
      try {
        if (styleNameRoute === TYPESOFDATASET.transatlantic) {
          setMenuValueCells(transatlanticColumnSelector);
        } else if (styleNameRoute === TYPESOFDATASET.intraAmerican) {
          setMenuValueCells(intraamericanColumnSelector);
        } else if (checkRouteForVoyages(styleNameRoute!)) {
          setMenuValueCells(allVoyageColumnSelector);
        } else if (
          styleNameRoute === TYPESOFDATASET.indianOceanAndAsiaSlaveTrades
        ) {
          setMenuValueCells(indianOceanAsiaSlaveTrades);
        } else if (styleNameRoute === TYPESOFDATASETPEOPLE.allEnslaved) {
          setMenuValueCells(enslavedColumnSelector);
        } else if (styleNameRoute === TYPESOFDATASETPEOPLE.africanOrigins) {
          setMenuValueCells(africanOriginsColumnSelector);
        } else if (styleNameRoute === TYPESOFDATASETPEOPLE.texas) {
          setMenuValueCells(texasColumnSelector);
        } else if (
          styleNameRoute === ENSALVERSTYLE ||
          styleNameRoute === TRANSATLANTICTRADS ||
          styleNameRoute === INTRAAMERICANTRADS ||
          styleNameRoute === INDIANOCEANANDASIANTRANDS
        ) {
          setMenuValueCells(enslaversColumnSelector);
        }
      } catch (error) {
        console.error('Failed to load table cell structure:', error);
      }
    };
    loadMenuValueCellStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleNameRoute]);

  const renderMenuItems = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodes: any[], parentKey = ''): MenuProps['items'] => {
      return nodes.map((node, index) => {
        const { label: nodeLabel, children, var_name, colID } = node;
        const hasChildren = children && children.length > 0;
        const menuLabel = (nodeLabel as LabelFilterMeneList)[languageValue];
        const isVisible = visibleColumnCells?.includes(colID);

        // Create unique key to prevent duplicates
        const uniqueKey = `${parentKey}-${colID || var_name || index}`;

        if (hasChildren) {
          return {
            key: uniqueKey,
            label: (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span>{menuLabel}</span>
                <span style={{ fontSize: '10px' }}>▶</span>
              </div>
            ),
            children: renderMenuItems(children, uniqueKey),
            // For parent items with children, pass the colID directly
            onClick: colID
              ? () => handleColumnVisibilityChange(colID)
              : undefined,
          };
        }

        return {
          key: uniqueKey,
          label: (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor: isVisible ? '#f0f8ff' : 'transparent',
                borderRadius: '4px',
                border: isVisible
                  ? '1px solid #1890ff'
                  : '1px solid transparent',
              }}
            >
              <span
                style={{
                  fontWeight: isVisible ? 600 : 400,
                  color: isVisible ? '#1890ff' : 'inherit',
                }}
              >
                {menuLabel}
              </span>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {isVisible ? (
                  <>
                    <CheckOutlined
                      style={{ color: '#52c41a', fontSize: '12px' }}
                    />
                    <EyeOutlined
                      style={{ color: '#1890ff', fontSize: '12px' }}
                    />
                  </>
                ) : (
                  <EyeInvisibleOutlined
                    style={{ color: '#d9d9d9', fontSize: '12px' }}
                  />
                )}
              </div>
            </div>
          ),
          // Pass the colID directly to the handler
          onClick: () => handleColumnVisibilityChange(colID),
          style: {
            padding: 0, // Remove default padding since we're adding it to the inner div
          },
        };
      });
    },
    [languageValue, visibleColumnCells, handleColumnVisibilityChange],
  );

  // Base button styles
  const baseButtonStyle = {
    fontSize: '0.80rem',
    textTransform: 'unset' as const,
    backgroundColor: getColorBTNVoyageDatasetBackground(styleNameRoute!),
    boxShadow: getColorBoxShadow(styleNameRoute!),
    fontWeight: 600,
    color: '#ffffff',
    width: 200,
    height: '32px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  // Event handlers for hover effects
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = getColorHoverBackground(styleNameRoute!);
    target.style.color = '#ffffff';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = getColorBTNVoyageDatasetBackground(
      styleNameRoute!,
    );
    target.style.color = '#ffffff';
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = getColorHoverBackground(styleNameRoute!);
    target.style.color = '#ffffff';
    target.style.outline = 'none';
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = getColorBTNVoyageDatasetBackground(
      styleNameRoute!,
    );
    target.style.color = '#ffffff';
  };

  const menu: MenuProps = useMemo(
    () => ({
      items: renderMenuItems(menuValueCells),
    }),
    [menuValueCells, renderMenuItems],
  );

  const visibleCount = visibleColumnCells?.length || 0;

  return (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <style>{COLUMN_SELECTOR_STYLES}</style>
      <Dropdown
        menu={menu}
        trigger={['click']}
        placement="bottomLeft"
        overlayStyle={{ minWidth: '250px' }}
      >
        <Button
          className="configureColumnsButton"
          style={baseButtonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {translatedHomepage.configureColumns}
          <span style={BADGE_STYLE}>{visibleCount}</span>
          <CaretDownOutlined />
        </Button>
      </Dropdown>
      <div>
        <Tooltip
          classNames={{ root: 'column-selector-tooltip' }}
          title={
            <div style={{ fontSize: 12 }}>
              <div>
                <strong>Column Configuration Help:</strong>
              </div>
              <div>• Click to show/hide columns</div>
              <div>• ✓ = Currently visible</div>
              <div>• 👁 = Shown in table</div>
              <div>• New columns appear on the right</div>
              <div>• Drag column headers to reorder</div>
              <div>• At least one column must remain visible</div>
            </div>
          }
        >
          <QuestionCircleOutlined
            aria-label="Column configuration help"
            style={{ cursor: 'pointer', paddingLeft: 4, fontSize: '0.85rem' }}
          />
        </Tooltip>
      </div>
    </span>
  );
};

export default ButtonDropdownColumnSelector;
