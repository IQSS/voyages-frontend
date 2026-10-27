// Helper functions
//
// `ownedKey` (optional): the label of this field on the ship's current data. A
// direct change to the field wins (including an explicit clear); otherwise the
// value falls back to the ship's current one, so a partial edit (some other
// ship field) still shows the real value -- matching the denormalised
// shipName sort column on the backend, which keeps grid and sort in step.
export const extractShipData = (
  changeSetData: any,
  property: string,
  ownedKey?: string,
) => {
  const shipChange = changeSetData.changes?.[0]?.changes?.find(
    (c: any) => c.kind === 'owned' && c.property === 'Voyage_Ship',
  );
  const direct = shipChange?.changes?.find((s: any) => s.property === property);
  if (direct) {
    return direct.changed || '';
  }
  return (ownedKey ? shipChange?.ownedEntity?.data?.[ownedKey] : '') || '';
};
