/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from 'react';

import {
  DirectPropertyChange,
  MaterializedEntity,
  TextProperty,
  NumberProperty,
  BoolProperty,
} from '@slavevoyages/voyages-contribute';
import { Input } from 'antd';

import { EntityFormProps } from './EntityForm';
import { EntityPropertyChangeCommentBox } from './EntityPropertyChangeCommentBox';

export interface DirectEntityPropertyFieldProps {
  property: TextProperty | NumberProperty | BoolProperty;
  entity: MaterializedEntity;
  lastChange?: DirectPropertyChange;
  onChange: EntityFormProps['onChange'];
  error?: boolean;
  readOnly?: boolean;
  commentsLocked?: boolean;
}

export const lowerCaseFirstLetter = (s: string) =>
  s.length > 0 ? s[0].toLocaleLowerCase() + s.slice(1) : s;

export const DirectEntityPropertyField = ({
  property,
  entity,
  lastChange,
  onChange,
  error = false,
  readOnly = false,
  commentsLocked = false,
}: DirectEntityPropertyFieldProps) => {
  const { kind, label } = property;
  const [comments, setComments] = useState<string | undefined>();
  // No comment where the value it would travel with is unknown (see
  // EntityFormProps.commentsLocked): it would record a clear.
  const commentLocked = commentsLocked && !lastChange;

  /**
   * A mandatory number on a new entity arrives showing `0`, because
   * `materializeNew` seeds it that way -- but nothing has been recorded, and
   * publication still counts the property as never set.
   *
   * Shown as `0`, the value is also unreachable. React reports an edit by
   * comparing against what the input already held, so typing the `0` back is
   * not an edit and never reaches this component. `Voyage.dataset` is where
   * that lands: Trans-Atlantic is dataset 0, so the largest database was the
   * one an editor could not choose.
   *
   * Rendered empty, the field says what is true -- nothing has been filled in
   * -- and `0` becomes a value someone can actually enter.
   */
  const seedsAMandatoryNumber =
    !lastChange &&
    kind === 'number' &&
    !!(property as { notNull?: boolean }).notNull &&
    entity.entityRef.type === 'new' &&
    entity.data[label] === 0;

  const value = lastChange
    ? lastChange.changed
    : seedsAMandatoryNumber
      ? null
      : ((entity.data[label] ?? null) as DirectPropertyChange['changed']);

  const handleChange = useCallback(
    (changed: DirectPropertyChange['changed']) => {
      // On mount the local `comments` state is undefined, and the effect below
      // re-emits the initial value. Falling back to the already-saved comment
      // keeps that first emit from wiping it -- the reason comments vanished
      // after save/reload. A user who clears the box sets it to "", which is
      // kept (only nullish falls back).
      const nextComments = comments ?? lastChange?.comments;
      if (
        changed === (lastChange?.changed ?? value) &&
        nextComments === lastChange?.comments
      ) {
        return;
      }
      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            kind: 'direct',
            property: property.uid,
            changed,
            comments: nextComments,
          },
        ],
      });
    },
    [onChange, entity, property, lastChange, value, comments],
  );

  useEffect(() => handleChange(value), [handleChange, value, comments]);
  if (
    value !== null &&
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    return (
      <span>BUG: Value type is incorrect for DirectEntityPropertyField</span>
    );
  }

  // For number inputs, ensure the value is numeric to avoid browser warnings
  // Use type="text" for non-numeric values to prevent "cannot be parsed" errors
  const inputType =
    kind === 'number' &&
    typeof value === 'string' &&
    value !== '' &&
    isNaN(Number(value))
      ? 'text'
      : kind === 'bool'
        ? 'text'
        : kind;

  return (
    <>
      <Input
        className={`truncate-input ${lastChange ? 'changedEntityProperty' : ''}`}
        type={inputType}
        status={error ? 'error' : undefined}
        placeholder={readOnly ? '' : `Enter ${lowerCaseFirstLetter(label)}`}
        style={{ width: 'calc(100% - 20px)' }}
        disabled={readOnly}
        value={typeof value === 'boolean' ? value.toString() : (value ?? '')}
        onChange={(e: any) => {
          const inputValue = e.target.value;
          if (kind === 'bool') {
            // Accept "true" or "false" (case-insensitive); otherwise fall back to original value
            if (inputValue.toLowerCase() === 'true' || inputValue === '1') {
              handleChange(true);
              return;
            }
            if (inputValue.toLowerCase() === 'false' || inputValue === '0') {
              handleChange(false);
              return;
            }
            // If not "true"/"false", just return the string so user sees what they typed
            handleChange(inputValue);
            return;
          }
          handleChange(inputValue);
        }}
      />
      <EntityPropertyChangeCommentBox
        property={property}
        current={lastChange?.comments}
        onComment={setComments}
        readOnly={readOnly || commentLocked}
      />
    </>
  );
};
