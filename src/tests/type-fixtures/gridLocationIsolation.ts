import type { PivotCrosstabResponse } from '../../share/InterfaceTypePivotTable';
import type { ContribuitLocation } from '../../share/InterfaceTypes';

// PR252 replaced grid column children with compact HTML-table column paths.
// Keep the original PR250 requirement: contribution locations must not merge
// structurally with the table's column model.
export const pivotColumn: PivotCrosstabResponse['columns'][number] = [
  'Africa',
  'St. Helena',
];
export const locationChild: ContribuitLocation['children'][number] = {
  id: 1,
  name: 'Audit location',
  value: 1,
  location_type: { name: 'Port' },
  spatial_extent: null,
  children: [],
};
type AssertFalse<T extends false> = T;
export type PivotHasNoLocationId = AssertFalse<
  'id' extends keyof PivotCrosstabResponse['columns'][number] ? true : false
>;
export type LocationHasNoGridField = AssertFalse<
  'field' extends keyof ContribuitLocation['children'][number] ? true : false
>;
// @ts-expect-error A location cannot be used as a pivot column path.
export const invalidPivotColumn: typeof pivotColumn = locationChild;
// @ts-expect-error A column path cannot be used as a contribution location.
export const invalidLocation: typeof locationChild = pivotColumn;
