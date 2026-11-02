import axios from 'axios';

import { AUTHTOKEN, BASEURL } from '@/share/AUTH_BASEURL';

const headers = () => ({
  Authorization: AUTHTOKEN,
  'Content-Type': 'application/json',
});

export interface RouteVoyageListItem {
  voyage_id: number;
  voyage_ship?: { ship_name?: string | null } | null;
  voyage_dates?: {
    imp_arrival_at_port_of_dis_sparsedate?: { year?: number | null } | null;
  } | null;
  voyage_itinerary?: {
    imp_principal_place_of_slave_purchase?: { name?: string | null } | null;
    imp_principal_port_slave_dis?: { name?: string | null } | null;
  } | null;
  enslavers?: { id: number; name_and_role: string }[] | null;
  voyage_outcome?: {
    particular_outcome?: { name?: string | null } | null;
  } | null;
  voyage_slaves_numbers?: {
    imp_total_num_slaves_embarked?: number | null;
    imp_total_num_slaves_disembarked?: number | null;
    imp_mortality_during_voyage?: number | null;
    imp_num_men_total?: number | null;
    imp_num_women_total?: number | null;
    imp_num_child_total?: number | null;
  } | null;
}

export interface RouteVoyageListResponse {
  count: number;
  page: number;
  page_size: number;
  results: RouteVoyageListItem[];
}

export const fetchRouteVoyagesPage = async (
  voyageIds: string[],
  page: number,
  pageSize: number,
  orderBy: string[],
): Promise<RouteVoyageListResponse> => {
  const response = await axios.post(
    `${BASEURL}/voyage/`,
    {
      page,
      page_size: pageSize,
      order_by: orderBy,
      filter: [
        { varName: 'voyage_id', op: 'in', searchTerm: voyageIds.map(Number) },
      ],
    },
    { headers: headers() },
  );
  return response.data as RouteVoyageListResponse;
};

export const fetchVoyageBibliography = async (
  voyageIds: string[],
): Promise<string[]> => {
  const response = await axios.post(
    `${BASEURL}/voyage/bibliography/`,
    { voyage_ids: voyageIds.map(Number) },
    { headers: headers() },
  );
  return response.data as string[];
};
