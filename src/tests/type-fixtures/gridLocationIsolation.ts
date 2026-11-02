import type { Children, ContribuitLocation } from '../../share/InterfaceTypes';

export const gridChild: Children = {
  columnGroupShow: 'open',
  headerName: 'Voyage ID',
  field: 'voyage_id',
  filter: '',
  sort: '',
  pinned: '',
};
export const locationChild: ContribuitLocation['children'][number] = {
  id: 1,
  name: 'Audit location',
  value: 1,
  location_type: { name: 'Port' },
  spatial_extent: null,
  children: [],
};
type AssertFalse<T extends false> = T;
export type GridHasNoLocationId = AssertFalse<
  'id' extends keyof Children ? true : false
>;
export type LocationHasNoGridField = AssertFalse<
  'field' extends keyof ContribuitLocation['children'][number] ? true : false
>;
