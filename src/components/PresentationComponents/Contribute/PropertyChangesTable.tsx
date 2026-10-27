/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';

import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import {
  AllProperties,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';
import { Table } from 'antd';
import { ColumnType } from 'antd/es/table';

import { convertTextProperty } from '@/utils/functions/convertTextProperty';

import PropertyChangeCard from './PropertyChangeCard';
interface PropertyChangesTableProps {
  change: PropertyChange[];
  handleDeleteChange: (propertyToDelete: string) => void;
  sectionName?: string;
  showTitle?: boolean;
}

const isNestedChange = (change: PropertyChange) => {
  const prop = AllProperties[change.property];
  return (
    prop !== undefined &&
    (prop.kind === 'ownedEntityList' ||
      prop.kind === 'entityOwned' ||
      (prop.kind === 'linkedEntity' &&
        change.kind === 'linked' &&
        !!change.linkedChanges))
  );
};

const onNestedCell =
  (colSpan: number) =>
  (c: PropertyTableRowType): React.TdHTMLAttributes<unknown> =>
    isNestedChange(c.change) ? { colSpan } : {};

interface PropertyTableRowType {
  key: string;
  property: string;
  change: PropertyChange;
}

const PropertyChangesTable = ({
  change,
  sectionName,
  handleDeleteChange,
}: PropertyChangesTableProps) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const renderCard = useCallback(
    (c: PropertyChange) => (
      <PropertyChangeCard
        change={c}
        property={c.property}
        handleDeleteChange={handleDeleteChange}
      />
    ),
    [handleDeleteChange],
  );
  const columns: ColumnType<PropertyTableRowType>[] = [
    {
      title: 'Field',
      dataIndex: 'change',
      key: 'property',
      onCell: onNestedCell(2),
      render: (change: PropertyChange) =>
        isNestedChange(change) ? (
          <div>{renderCard(change)}</div>
        ) : (
          <div>{convertTextProperty(change.property)}</div>
        ),
    },
    {
      title: 'Value',
      dataIndex: 'change',
      key: 'property',
      onCell: onNestedCell(0),
      render: (change: PropertyChange) =>
        isNestedChange(change) ? <></> : <div>{renderCard(change)}</div>,
    },
    // Todo: Undo here is going to be very complicated, what we can do "easily" is "pop" the last change out, if that is your undo, then you can implement it.
    // {
    //   title: 'Action',
    //   dataIndex: 'undo',
    //   key: 'undo',
    //   width: 50,
    //   flex: 1,
    //   render: (_: any, record: any) => {
    //     console.log({ record })
    //     return (
    //       <Button
    //       type="text"
    //       danger
    //       icon={<DeleteOutlined />}
    //       onClick={() => handleDeleteChange(record.property)}
    //     />
    //     );
    //   }
    // }
  ];

  const sortedChanges = [...change].sort((a, b) =>
    a.property.localeCompare(b.property),
  );

  const seenProperties = new Set<string>();

  const dataSource: PropertyTableRowType[] = sortedChanges
    .filter((c): c is PropertyChange => !!c && typeof c.property === 'string')
    .map((c, index) => {
      const isFirstOccurrence = !seenProperties.has(c.property);
      if (isFirstOccurrence) seenProperties.add(c.property);
      const rowKey = `${c.property}-${index}`;
      return {
        key: rowKey,
        property: c.property,
        change: c,
      };
    });

  return (
    <>
      <div
        className="section-header-title"
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        aria-expanded={expanded}
      >
        <strong>{convertTextProperty(sectionName!)}</strong>
        {expanded ? (
          <CaretUpOutlined className="expanded-icon" />
        ) : (
          <CaretDownOutlined style={{ marginLeft: 10, fontSize: 18 }} />
        )}
      </div>

      {expanded && (
        <Table<PropertyTableRowType>
          size="small"
          className="property-changes-table"
          pagination={false}
          columns={columns}
          dataSource={dataSource}
          bordered
          showHeader={false}
        />
      )}
    </>
  );
};

export default PropertyChangesTable;
