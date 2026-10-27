// `ownedKey` (optional): the label of this linked field on the ship's current
// data. A change wins (including an explicit clear); otherwise it falls back to
// the ship's current linked value, so a partial edit still shows the real one
// -- matching the denormalised nationality sort column on the backend.
export const extractLinkedShipData = (
  changeSetData: any,
  property: string,
  dataKey: string,
  ownedKey?: string,
) => {
  const shipChange = changeSetData.changes?.[0]?.changes?.find(
    (c: any) => c.kind === 'owned' && c.property === 'Voyage_Ship',
  );
  const linked = shipChange?.changes?.find((s: any) => s.property === property);
  if (linked) {
    return linked.changed?.data?.[dataKey] || '';
  }
  return (
    (ownedKey
      ? shipChange?.ownedEntity?.data?.[ownedKey]?.data?.[dataKey]
      : '') || ''
  );
};
