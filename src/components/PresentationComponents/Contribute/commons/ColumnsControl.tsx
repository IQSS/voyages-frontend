/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';

import { SettingOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Dropdown, Space } from 'antd';

import {
  clearColumnVisibility,
  saveColumnVisibility,
  ColumnVisibility,
} from '@/utils/contribute/columnVisibilityStore';

interface ColumnsControlProps {
  // AG Grid ref; its api drives visibility. Loosely typed to match the hook.
  gridRef: any;
  // The column definitions, used for the checkbox labels and reset defaults.
  columnDefs: any[];
}

interface ColumnItem {
  colId: string;
  name: string;
  visible: boolean;
}

/**
 * A custom columns control for the Edit Requests grid. AG Grid Community has no
 * tool panel, so once a column is dragged out there is no built-in way back.
 * This lists every data column as a checkbox, toggles visibility through the
 * grid api, and persists the choice (with a Reset to defaults).
 */
export const ColumnsControl = ({
  gridRef,
  columnDefs,
}: ColumnsControlProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ColumnItem[]>([]);

  // Only columns with a field are toggleable (the selection checkbox column has
  // none). colId defaults to field in AG Grid, so field is the id here.
  const toggleable = columnDefs.filter((c) => typeof c.field === 'string');

  // Write the grid's current visibility to storage as colId -> hidden.
  const persist = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const visibility: ColumnVisibility = {};
    for (const state of api.getColumnState()) {
      if (state.colId) visibility[state.colId] = !!state.hide;
    }
    saveColumnVisibility(visibility);
  }, [gridRef]);

  // Read current visibility from the grid so the menu reflects drag-to-hide too.
  const refresh = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const hiddenById = new Map<string, boolean>(
      api.getColumnState().map((s: any) => [s.colId, !!s.hide]),
    );
    setItems(
      toggleable.map((c) => ({
        colId: c.field as string,
        name: (c.headerName as string) ?? (c.field as string),
        visible: !hiddenById.get(c.field as string),
      })),
    );
  }, [gridRef, toggleable]);

  const onToggle = useCallback(
    (colId: string, visible: boolean) => {
      gridRef.current?.api?.setColumnsVisible([colId], visible);
      persist();
      refresh();
    },
    [gridRef, persist, refresh],
  );

  const onReset = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    // Back to the definitions' own hide flags.
    api.applyColumnState({
      state: toggleable.map((c) => ({
        colId: c.field as string,
        hide: !!c.hide,
      })),
    });
    clearColumnVisibility();
    refresh();
  }, [gridRef, toggleable, refresh]);

  const panel = (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        padding: '8px 12px',
        minWidth: 200,
        maxHeight: 360,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Show columns</div>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {items.map((item) => (
          <Checkbox
            key={item.colId}
            checked={item.visible}
            onChange={(e) => onToggle(item.colId, e.target.checked)}
          >
            {item.name}
          </Checkbox>
        ))}
      </Space>
      <Divider style={{ margin: '8px 0' }} />
      <Button type="link" size="small" onClick={onReset} style={{ padding: 0 }}>
        Reset to defaults
      </Button>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={(next) => {
        // Sync from the grid each time it opens, so drag-to-hide is reflected.
        if (next) refresh();
        setOpen(next);
      }}
      trigger={['click']}
      placement="bottomRight"
      popupRender={() => panel}
    >
      <Button icon={<SettingOutlined />}>Columns</Button>
    </Dropdown>
  );
};
