import React, { ReactNode, useMemo, useEffect } from 'react';

import {
  EntityChange,
  EntitySchema,
  MaterializedEntity,
  PropertyAccessLevel,
} from '@slavevoyages/voyages-contribute';
import { CollapseProps, Form, Typography } from 'antd';

import { StyledCollapse } from '@/styleMUI/stylesMenu/styleCollapse';
import { displayPropertyLabel } from '@/utils/contribute/propertyLabels';

import { EntityPropertyComponent } from './EntityPropertyComponent';

export interface ContributionFormProps {
  entity: MaterializedEntity;
}

export interface EntityFormProps {
  schema: EntitySchema;
  entity: MaterializedEntity;
  changes: EntityChange[];
  onChange: (change: EntityChange) => void;
  /*
    entity: MaterializedEntity
    changeSet: ChangeSet
    onUpdate: (changeSet: ChangeSet) => void
    */
  expandedMenu: string[];
  setExpandedMenu: React.Dispatch<React.SetStateAction<string[]>>;
  accessLevel: PropertyAccessLevel;
  onSectionsChange?: (sections: CollapseProps['items']) => void;
  readOnly?: boolean;
  /**
   * Property uids that stay editable even when the form is read-only.
   *
   * An editor opening a submitted contribution is reading, not editing -- with
   * one exception. `Voyage.dataset` is theirs to supply and nobody else's, so
   * requiring them to open a review to reach one field put the two halves of a
   * single decision behind a toggle.
   */
  editableWhenReadOnly?: string[];
  /**
   * When set, only these property uids render. Used for the year-only voyage
   * date fields, whose owned VoyageSparseDate schema carries Year/Month/Day but
   * should present the Year alone. Purely presentational -- the value stored is
   * still the Year on the same backing table.
   */
  visiblePropertyUids?: string[];
  errorPropertyUids?: string[];
  /**
   * The entity's stored values are unknown -- an existing voyage that failed
   * to load. A comment has to travel with the field's value, so on a field
   * whose value is unknown it would record a clear of the stored one; such
   * fields take no comments.
   */
  commentsLocked?: boolean;
  /** Shown under a field listed in `errorPropertyUids`. */
  errorHint?: string;
}

// Section labels that differ from what the voyages-contribute package ships.
// Keyed by the package's section string, valued by what the UI should display.
const SECTION_LABEL_OVERRIDES: Record<string, string> = {
  'Slave numbers': 'Enslaved',
  'Ship, Nations': 'Ship and nation',
  'Voyage Outcome': 'Voyage outcomes',
  'Voyage Itinerary': 'Voyage itinerary',
  'Voyage Dates': 'Voyage dates',
  // Subsections under "Enslaved (numbers)" (DD-0541). The backing package still
  // ships the old section strings until it is rebuilt, so relabel them here too
  // (sentence case). Harmless once the package carries the new names.
  Numbers: 'Totals',
  'Enslaved (characteristics)': 'Age and sex',
};

export const EntityForm = ({
  schema,
  entity,
  changes,
  onChange,
  expandedMenu,
  setExpandedMenu,
  accessLevel,
  onSectionsChange,
  readOnly = false,
  editableWhenReadOnly,
  visiblePropertyUids,
  errorPropertyUids,
  commentsLocked = false,
  errorHint = 'Please fill out this field before accepting.',
}: EntityFormProps) => {
  const properties = useMemo(
    () =>
      schema.properties.filter(
        (p) =>
          (p.accessLevel === undefined || p.accessLevel <= accessLevel) &&
          (visiblePropertyUids === undefined ||
            visiblePropertyUids.includes(p.uid)),
      ),
    [schema, accessLevel, visiblePropertyUids],
  );

  const children = useMemo(
    () =>
      properties.map((p) => {
        const isError = errorPropertyUids?.includes(p.uid) ?? false;
        const displayLabel = displayPropertyLabel(p);
        const component = (
          <>
            <EntityPropertyComponent
              key={p.uid}
              schema={schema}
              expandedMenu={expandedMenu}
              setExpandedMenu={setExpandedMenu}
              entity={entity}
              property={p}
              changes={changes}
              onChange={onChange}
              accessLevel={accessLevel}
              readOnly={readOnly && !editableWhenReadOnly?.includes(p.uid)}
              commentsLocked={commentsLocked}
              error={isError}
            />
          </>
        );

        return p.kind === 'bool' ||
          p.kind === 'text' ||
          p.kind === 'number' ||
          p.kind === 'linkedEntity' ||
          p.kind === 'table'
          ? addLabel(component, displayLabel, p.schema, isError, errorHint)
          : component;
      }),
    [
      properties,
      schema,
      expandedMenu,
      setExpandedMenu,
      entity,
      changes,
      onChange,
      accessLevel,
      readOnly,
      editableWhenReadOnly,
      errorPropertyUids,
      commentsLocked,
      errorHint,
    ],
  );

  // Group by sections (if any).
  const [ungrouped, sections] = useMemo(() => {
    const map: Record<string, ReactNode[]> = {};
    for (let i = 0; i < properties.length; ++i) {
      (map[properties[i].section ?? ''] ??= []).push(children[i]!);
    }
    const collapsible: CollapseProps['items'] = [];
    for (const [section, items] of Object.entries(map)) {
      if (section !== '') {
        const displaySection = SECTION_LABEL_OVERRIDES[section] ?? section;
        collapsible.push({
          // Stable key so the panel's expanded/collapsed state survives
          // accessLevel changes — it must not depend on which properties
          // are currently filtered into the section.
          key: `${schema.name}-${section}`,
          label: (
            <Typography.Title level={4} className="collapse-title">
              {displaySection}
            </Typography.Title>
          ),
          children: (
            <div>
              {items.map((item, index) => (
                <div key={`${section}-${index}`}>{item}</div>
              ))}
            </div>
          ),
        });
      }
    }

    return [map[''] ?? [], collapsible];
  }, [properties, children, schema.name]);

  useEffect(() => {
    onSectionsChange?.(sections);
  }, [sections, onSectionsChange]);
  return (
    <>
      {ungrouped.length > 0 &&
        ungrouped.map((item, index) => (
          <div key={`ungrouped-${index}`}>{item}</div>
        ))}
      {sections.length > 0 && (
        <StyledCollapse
          activeKey={expandedMenu}
          onChange={(keys) => {
            setExpandedMenu(keys as string[]);
          }}
          bordered={false}
          items={sections}
          ghost
          className="custom-collapse"
        />
      )}
    </>
  );
};

const addLabel = (
  item: ReactNode,
  label: string,
  schema: string,
  error = false,
  hint = '',
) => {
  const fillOutHint = error ? (
    <Typography.Text type="danger" style={{ fontSize: 12, display: 'block' }}>
      {hint}
    </Typography.Text>
  ) : null;
  const isVoyageSparseDate = schema === 'VoyageSparseDate';
  if (isVoyageSparseDate) {
    // For date fields, use a more compact layout with better alignment
    return (
      <Form.Item
        label={<span className="form-contribute-label">{label}</span>}
        name={label}
        style={{
          margin: '8px 0px',
          marginBottom: '12px',
        }}
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {item}
        </div>
        {fillOutHint}
      </Form.Item>
    );
  }

  // For regular fields
  return (
    <Form.Item
      label={<span className="form-contribute-label">{label}</span>}
      name={label}
      style={{ margin: '2px 0 4px 0' }}
    >
      {item}
      {fillOutHint}
    </Form.Item>
  );
};
