import axios from 'axios';

import { AUTHTOKEN, BASEURL } from '@/share/AUTH_BASEURL';
import { PivotCrosstabResponse } from '@/share/InterfaceTypePivotTable';

export interface NodePivotRequest {
  columns: string[];
  rows: string;
  rows_label: string;
  binsize: number | null;
  value_field: string;
  agg_fn: string;
}

export const fetchNodePivot = async (
  request: NodePivotRequest,
  voyageIds: string[],
): Promise<PivotCrosstabResponse> => {
  const response = await axios.post(
    `${BASEURL}/voyage/crosstabs/`,
    {
      ...request,
      filter: [
        { varName: 'voyage_id', op: 'in', searchTerm: voyageIds.map(Number) },
      ],
    },
    {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data as PivotCrosstabResponse;
};
