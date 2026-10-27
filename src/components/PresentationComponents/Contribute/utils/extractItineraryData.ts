export const extractItineraryData = (changeSetData: any) => {
  const itineraryChange = changeSetData.changes?.[0]?.changes?.find(
    (c: any) => c.kind === 'owned' && c.property === 'Voyage_Itinerary',
  );
  return (
    itineraryChange?.changes?.find(
      (c: any) => c.property === 'VoyageItinerary_port_of_departure_id',
    )?.changed?.data?.Name || ''
  );
};
