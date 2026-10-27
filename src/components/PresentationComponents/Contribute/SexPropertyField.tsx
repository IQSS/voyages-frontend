import { useState } from 'react';

import {
  DirectPropertyChange,
  MaterializedEntity,
  NumberProperty,
} from '@slavevoyages/voyages-contribute';
import { Select } from 'antd';

import { SEX_OPTIONS } from '@/utils/contribute/sex';

import { EntityFormProps } from './EntityForm';
import { EntityPropertyChangeCommentBox } from './EntityPropertyChangeCommentBox';

export interface SexPropertyFieldProps {
  property: NumberProperty;
  entity: MaterializedEntity;
  lastChange?: DirectPropertyChange;
  onChange: EntityFormProps['onChange'];
  readOnly?: boolean;
  commentsLocked?: boolean;
  error?: boolean;
}

/**
 * The sex of an enslaved person (DD-0550).
 *
 * Stored on `gender_int` as a bare integer, and until now edited as one -- an
 * editor had to know that 1 means Male to record it. Presented here as the
 * Male / Female choice it is; the stored value is unchanged, only the way it is
 * picked. Mirrors DatasetPropertyField, the other integer-as-choice field.
 */
export const SexPropertyField = ({
  property,
  entity,
  lastChange,
  onChange,
  readOnly = false,
  commentsLocked = false,
  error = false,
}: SexPropertyFieldProps) => {
  const [comments, setComments] = useState<string | undefined>();
  // No comment where the value it would travel with is unknown (see
  // EntityFormProps.commentsLocked): it would record a clear.
  const commentLocked = commentsLocked && !lastChange;
  const stored = lastChange ? lastChange.changed : entity.data[property.label];

  // A new Enslaved arrives carrying the 0 `materializeNew` seeds into numbers,
  // which is neither Male nor Female. Nothing was chosen, so nothing is shown
  // or recorded as chosen -- the same rule as DatasetPropertyField.
  const nothingChosen =
    !lastChange && entity.entityRef.type === 'new' && stored === 0;
  const value =
    nothingChosen || stored === null || stored === undefined || stored === ''
      ? undefined
      : Number(stored);

  const handleChange = (chosen: number) => {
    onChange({
      type: 'update',
      entityRef: entity.entityRef,
      changes: [
        {
          kind: 'direct',
          property: property.uid,
          changed: String(chosen),
          // Keep an existing comment when only the sex changes.
          comments: comments ?? lastChange?.comments,
        },
      ],
    });
  };

  // A comment is recorded as soon as it is entered, against the value as shown,
  // like the text and number fields do. Keeping it only in local state meant it
  // was saved only if the sex was changed afterwards -- otherwise the bubble
  // silently dropped it (DD-0545). The shown value, not the stored one, so a
  // new voyage's seeded 0 is never recorded as a choice nobody made.
  const handleComment = (comment: string) => {
    setComments(comment);
    onChange({
      type: 'update',
      entityRef: entity.entityRef,
      changes: [
        {
          kind: 'direct',
          property: property.uid,
          changed: value === undefined ? null : String(value),
          comments: comment,
        },
      ],
    });
  };

  return (
    <>
      <Select
        className={lastChange ? 'changedEntityProperty' : undefined}
        style={{ width: 'calc(100% - 20px)' }}
        placeholder="Select sex"
        value={value}
        onChange={handleChange}
        options={SEX_OPTIONS}
        disabled={readOnly}
        status={error ? 'error' : undefined}
        // This field renders inside the "Add new Enslaved" MUI dialog (z-index
        // 1300); without a higher popup z-index the antd dropdown (1050) opens
        // behind the dialog and the Male/Female options are invisible.
        styles={{ popup: { root: { zIndex: 9999 } } }}
      />
      <EntityPropertyChangeCommentBox
        property={property}
        current={lastChange?.comments}
        onComment={handleComment}
        readOnly={readOnly || commentLocked}
      />
    </>
  );
};
