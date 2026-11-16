export interface Nodes extends d3.SimulationNodeDatum {
  id: number;
  node_class: string;
  uuid: string;
  data: NodesData;
  source: NodesID;
}
export interface NodesData {
  principal_alias?: string;
  voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year?: number | null;
  voyage_itinerary__imp_principal_place_of_slave_purchase__name?: string | null;
  voyage_itinerary__imp_principal_port_slave_dis__name?: string | null;
  voyage_ship__ship_name?: string | null;
  age?: number;
  documented_name?: string;
  gender?: number;
  relation_type__name?: string;
  voyage?: number;
  alias?: string;
  identity?: number;
}
export interface NodesID {
  id: string;
}
export interface EdgeNode {
  x: number;
  y: number;
}

export interface Edges extends d3.SimulationLinkDatum<Nodes> {
  data: RoleName;
  source: string | Nodes;
  target: string | Nodes;
}

export interface EdgesProps extends d3.SimulationLinkDatum<Nodes> {
  data?: RoleName;
  source: Nodes;
  target: Nodes;
}

export interface RoleName {
  role_name?: string;
}
export type netWorkDataProps = {
  nodes: Nodes[];
  edges: Edges[];
};

export interface InitialStatePastNetworksData {
  data: netWorkDataProps;
  nodes: Nodes[];
  edges: Edges[];
  openModal: boolean;
  networkID: number | null;
  networkKEY: string;
}
