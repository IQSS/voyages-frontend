import React from 'react';

import {
  EntityLinkEditMode,
  LinkedEntityProperty,
  MaterializedEntity,
  PropertyAccessLevel,
  VoyageSourceSchema,
} from '@slavevoyages/voyages-contribute';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { LinkedEntityPropertyComponent } from '@/components/PresentationComponents/Contribute/LinkedEntityPropertyComponent';

const enumeration = vi.hoisted(() => vi.fn(() => ({ items: [] })));
vi.mock('@/hooks/useEnumeration', () => ({
  useSchemaEnumeration: enumeration,
}));
vi.mock('@/hooks/useTreeSelectContributeLocation', () => ({
  useTreeSelectContributeLocation: () => ({
    locationsList: [],
    loading: false,
    error: null,
  }),
}));
vi.mock(
  '@/components/PresentationComponents/Contribute/LinkedEntityOwnedPropertyComponent',
  () => ({
    LinkedEntityOwnedPropertyComponent: () => <div data-testid="owned-field" />,
  }),
);
vi.mock(
  '@/components/PresentationComponents/Contribute/LinkedEntityAddNewDialogComponent',
  () => ({
    default: () => <button type="button">Add linked entity</button>,
  }),
);
vi.mock(
  '@/components/PresentationComponents/Contribute/EntityPropertyChangeCommentBox',
  () => ({
    EntityPropertyChangeCommentBox: ({
      onComment,
      current,
      readOnly,
    }: {
      onComment: (comment: string) => void;
      current?: string;
      readOnly?: boolean;
    }) => (
      <textarea
        aria-label="Comment"
        value={current ?? ''}
        readOnly={readOnly}
        onChange={(event) => onComment(event.target.value)}
      />
    ),
  }),
);

const property = VoyageSourceSchema.properties.find(
  (item) => item.kind === 'linkedEntity' && item.label === 'Short reference',
) as LinkedEntityProperty;
const linked: MaterializedEntity = {
  entityRef: { schema: property.linkedEntitySchema, id: 123, type: 'existing' },
  data: { Name: 'Current reference' },
  state: 'original',
};
const onChange = vi.fn();
const props = (
  mode: EntityLinkEditMode,
  value: MaterializedEntity | string | number | boolean | null = linked,
): React.ComponentProps<typeof LinkedEntityPropertyComponent> => ({
  property: { ...property, mode },
  schema: VoyageSourceSchema,
  entity: {
    entityRef: { schema: VoyageSourceSchema.name, id: 7, type: 'existing' },
    data: { [property.label]: value },
    state: 'original',
  },
  changes: [],
  onChange,
  expandedMenu: [],
  setExpandedMenu: vi.fn(),
  accessLevel: PropertyAccessLevel.Editor,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test('switches between view, selection, owned and create modes without changing hook order', () => {
  const { rerender } = render(
    <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.View)} />,
  );
  expect(screen.getByText('123')).toBeTruthy();
  expect(enumeration).not.toHaveBeenCalled();

  rerender(
    <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.Select)} />,
  );
  expect(screen.getByRole('combobox')).toBeTruthy();
  expect(screen.getByText('Current reference')).toBeTruthy();

  rerender(
    <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.Own)} />,
  );
  expect(screen.getByTestId('owned-field')).toBeTruthy();
  expect(screen.queryByRole('combobox')).toBeNull();

  rerender(
    <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.Create)} />,
  );
  expect(screen.getByRole('combobox')).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Add linked entity' }),
  ).toBeTruthy();

  rerender(
    <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.View, null)} />,
  );
  expect(screen.getByText('null')).toBeTruthy();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

test.each(['invalid reference', 0, false, ''])(
  'recovers from invalid linked value %j without losing hook consistency',
  (value) => {
    const { rerender } = render(
      <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.Select)} />,
    );
    expect(screen.getByRole('combobox')).toBeTruthy();

    rerender(
      <LinkedEntityPropertyComponent
        {...props(EntityLinkEditMode.Select, value)}
      />,
    );
    expect(
      screen.getByText('BUG: Expected an entity reference value!'),
    ).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();

    rerender(
      <LinkedEntityPropertyComponent
        {...props(EntityLinkEditMode.Select, linked)}
      />,
    );
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.getByText('Current reference')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  },
);

test('retains null selections and records a comment against the current linked value after a mode change', () => {
  const { rerender } = render(
    <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.View)} />,
  );
  rerender(
    <LinkedEntityPropertyComponent
      {...props(EntityLinkEditMode.Select, null)}
    />,
  );
  expect(screen.getByRole('combobox')).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();

  rerender(
    <LinkedEntityPropertyComponent {...props(EntityLinkEditMode.Select)} />,
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), {
    target: { value: 'Review this reference' },
  });
  expect(onChange).toHaveBeenCalled();
  for (const [change] of onChange.mock.calls) {
    expect(change).toMatchObject({
      type: 'update',
      changes: [
        {
          kind: 'linked',
          property: property.uid,
          changed: { entityRef: linked.entityRef, data: linked.data },
          comments: 'Review this reference',
        },
      ],
    });
  }
});
