import {
    addToChangeSet,
    combineChanges,
    dropOrphans,
    EntityChange,
    PropertyChange,
  } from '@/models/changeSets';
  import { ChangeSet } from '@/models/contribution';
  import { EntitySchema, getSchema } from '@/models/entities';
  import {
    applyChanges,
    cloneEntity,
    expandMaterialized,
    MaterializedEntity,
  } from '@/models/materialization';
  import { PropertyAccessLevel } from '@/models/properties';
  import { RootState } from '@/redux/store';
  import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';
  import {
    Button,
    Collapse,
    CollapseProps,
    Form,
    Input,
    Select,
    Typography,
  } from 'antd';
  import React, {
    ReactNode,
    useCallback,
    useMemo,
    useState,
    useEffect,
  } from 'react';
  import { useSelector } from 'react-redux';
  import { EntityPropertyComponent } from './EntityPropertyComponent';
  import FormItemLabel from 'antd/es/form/FormItemLabel';
  
  export interface ContributionFormProps {
    entity: MaterializedEntity;
    // onUpdate: (contribution: Contribution) => void;
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
  }
  
  const addLabel = (item: ReactNode, label: string) => {
    return (
      <Form.Item
        label={<span className="form-contribute-label">{label}</span>}
        name={label}
        style={{ marginBottom: 0 }}
      >
        {item}
      </Form.Item>
    );
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
  }: EntityFormProps) => {
    const properties = useMemo(
      () =>
        schema.properties.filter(
          (p) => p.accessLevel === undefined || p.accessLevel <= accessLevel,
        ),
      [schema, accessLevel],
    );
  
    const children = useMemo(
      () =>
        properties.map((p) => {
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
              />
            </>
          );
  
          return p.kind === 'bool' ||
            p.kind === 'text' ||
            p.kind === 'number' ||
            p.kind === 'linkedEntity'
            ? addLabel(component, p.label)
            : component;
        }),
      [
        properties,
        accessLevel,
        schema,
        expandedMenu,
        setExpandedMenu,
        entity,
        changes,
        onChange,
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
          collapsible.push({
            key: `${items.map((item) => {
              if (React.isValidElement(item)) {
                return item.props.children.key;
              } else {
                return item?.toString();
              }
            })}`,
            label: (
              <Typography.Title level={4} className="collapse-title">
                {section}
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
    }, [properties, children]);
  
    useEffect(() => {
      onSectionsChange?.(sections);
    }, [sections, onSectionsChange]);
  
    return (
      <div>
        {ungrouped.length > 0 &&
          ungrouped.map((item, index) => (
            <div key={`ungrouped-${index}`}>{item}</div>
          ))}
        {sections.length > 0 && (
          <div>
            <Collapse
              activeKey={expandedMenu}
              onChange={(keys) => {
                setExpandedMenu(keys as string[]);
              }}
              bordered={false}
              items={sections}
              ghost
              className="custom-collapse"
            />
          </div>
        )}
      </div>
    );
  };
  
  interface PropertyChangeCardProps {
    change: PropertyChange;
  }
  
  const PropertyChangeCard = ({ change }: PropertyChangeCardProps) => {
    const { property } = change;
    let display: ReactNode = undefined;
    if (change.kind === 'direct') {
      display = <b>{change.changed + ''}</b>;
    } else if (change.kind === 'linked') {
      const { changed } = change;
      display = (
        <b>
          {changed ? (
            <>
              <span>
                {changed.entityRef.schema}#{changed.entityRef.id}
              </span>
              {change.linkedChanges && (
                <PropertyChangesList changes={change.linkedChanges} />
              )}
            </>
          ) : (
            '<null>'
          )}
        </b>
      );
    }
    if (change.kind === 'owned') {
      display = (
        <div style={{ paddingLeft: '20px' }}>
          <PropertyChangesList changes={change.changes} />
        </div>
      );
    }
    if (change.kind === 'ownedList') {
      display = (
        <div style={{ paddingLeft: '20px' }}>
          {change.modified && <PropertyChangesList changes={change.modified} />}
          <ul>
            {change.removed.map((r, i) => (
              <li key={i}>Removed item with id {r.id}</li>
            ))}
          </ul>
        </div>
      );
    }
    // TODO: other kinds
    return (
      <>
        {change.kind !== 'ownedList' && (
          <>
            <span className='property-change'>
              {property}
              {' => '}
            </span>
          </>
        )}
        {display}
        &nbsp;
        <small>{change.comments}</small>
      </>
    );
  };
  
  const accessLevelOptions = Object.entries(PropertyAccessLevel)
    .filter(([key]) => isNaN(Number(key)) && key !== 'Hidden') // Filter out reverse mapping
    .map(([label, value]) => ({
      label: label.replace(/([A-Z])/g, ' $1').trim(), // Add spaces between camel case
      value: value,
    }));
  
  interface PropertyChangesListProps {
    changes: PropertyChange[];
  }
  
  const PropertyChangesList = ({ changes }: PropertyChangesListProps) => {
    return (
      <ul>
        {changes.map((pc, idxPC) => (
          <li key={idxPC}>
            <PropertyChangeCard change={pc} />
          </li>
        ))}
      </ul>
    );
  };
  
  const tempCreateChangeSet = (
    schema: EntitySchema,
    entity: MaterializedEntity,
  ) => ({
    id: -1,
    author: 'Mocked',
    title: `Contribution for ${schema.getLabel(entity.data)}`,
    changes: [],
    comments: '',
    timestamp: new Date().getDate(),
  });
  
  export const ContributionForm = ({ entity }: ContributionFormProps) => {
    const [accessLevel, setAccessLevel] = useState<PropertyAccessLevel>(
      PropertyAccessLevel.AdvancedContributor,
    );
    const schema = getSchema(entity.entityRef.schema);
    // TODO: Change props for the form to include the changeSet as well.
    const [changeSet, setChangeSet] = useState<ChangeSet>(
      tempCreateChangeSet(schema, entity),
    );
    useEffect(() => {
      setChangeSet(tempCreateChangeSet(schema, entity));
    }, [schema, entity]);
    // TODO: debounce changeSet and update the Contribution
    const onChangesUpdate = useCallback(
      (c: EntityChange) =>
        setChangeSet((current) => {
          // Merge the change with our change set.
          const next = addToChangeSet(current.changes, c);
          dropOrphans(next);
          return { ...current, changes: next };
        }),
      [setChangeSet],
    );
    const [globalExpand, setGlobalExpand] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string[]>([]);
    const { languageValue } = useSelector(
      (state: RootState) => state.getLanguages,
    );
    const translatedcontribute = translationLanguagesContribute(languageValue);
    const [sections, setSections] = useState<CollapseProps['items']>([]);
  
    const toggleExpandAll = () => {
      if (globalExpand) {
        setExpandedMenu([]);
      } else {
        const allSectionKeys =
          sections?.map((section) => section.key as string) ?? [];
        setExpandedMenu(allSectionKeys);
      }
      setGlobalExpand((prevState) => !prevState);
    };
  
    const handleJohnButton = useCallback(() => {
      const combined = combineChanges(changeSet.changes);
      console.log('Combined and flattened change set:');
      console.dir(combined);
      const changed = cloneEntity(entity);
      applyChanges(expandMaterialized(changed), changeSet.changes);
      console.log('This is the version with applied changes:');
      console.dir(changed);
    }, [changeSet]);
  
    return (
      <>
        <Button danger onClick={handleJohnButton}>
          John's Button
        </Button>
        <Form.Item label="Contribution title" style={{margin: '15px 0'}}>
          <Input
            value={changeSet.title}
            onChange={(e) =>
              setChangeSet({ ...changeSet, title: e.target.value })
            }
          />
        </Form.Item>
        <Form.Item label="Contribution message">
          <Input.TextArea
            rows={4}
            value={changeSet.comments}
            onChange={(e) =>
              setChangeSet({ ...changeSet, title: e.target.value })
            }
          />
        </Form.Item>
        <ul>
          {/* TODO: A list view of the changes in a nice format */}
          {changeSet.changes.map((ec, idxEC) => {
            const details =
              ec.type === 'update' ? (
                <PropertyChangesList changes={ec.changes} />
              ) : null;
            return (
              <li key={idxEC}>
                {ec.type} @ {ec.entityRef.schema}#{ec.entityRef.id}
                {details}
              </li>
            );
          })}
        </ul>
        {/* TODO: for now it is ok to allow the choice of "Editor" here, but this
        will have to be blocked for non-editors using authz */}
        <Form.Item label="Contrib mode">
          <Select
            value={accessLevel}
            onChange={(value: PropertyAccessLevel) => setAccessLevel(value)}
            options={accessLevelOptions}
            style={{ width: 200, margin: '10px 0' }}
          />
        </Form.Item>
        <div className="expand-collapse">
          {translatedcontribute.titleCollaps}{' '}
          <a href="#" onClick={toggleExpandAll}>
            {!globalExpand
              ? translatedcontribute.expand
              : translatedcontribute.collapse}
          </a>{' '}
        </div>
        <EntityForm
          key={entity.entityRef.id}
          schema={schema}
          entity={entity}
          changes={changeSet.changes}
          onChange={onChangesUpdate}
          setExpandedMenu={setExpandedMenu}
          expandedMenu={expandedMenu}
          accessLevel={accessLevel}
          onSectionsChange={setSections}
        />
      </>
    );
  };
  