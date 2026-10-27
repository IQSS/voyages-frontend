import { schemeTableau10 } from 'd3-scale-chromatic';

import { Edges, Nodes } from '@/share/InterfaceTypePastNetworks';

const NODE_SLOTS = [0, 1, 2, 3];
const EDGE_SLOTS = [4, 5, 6, 7, 8, 9];

export const UNSPECIFIED_EDGE_COLOR = '#aaa';

export const nodeClassColors: Record<string, string> = {
  voyages: schemeTableau10[NODE_SLOTS[0]],
  enslavers: schemeTableau10[NODE_SLOTS[1]],
  enslaved: schemeTableau10[NODE_SLOTS[2]],
  enslavement_relations: schemeTableau10[NODE_SLOTS[3]],
};

export const nodeColor = (nodeClass: string): string =>
  nodeClassColors[nodeClass] ?? 'gray';

export const collectNodeClasses = (nodes: Nodes[]): string[] =>
  Array.from(
    new Set(nodes.map((node) => node?.node_class).filter(Boolean)),
  ) as string[];

export const edgeRoleName = (edge: Edges): string => {
  const roleName = edge?.data?.role_name;
  return typeof roleName === 'string' ? roleName.trim() : '';
};

export const collectEdgeRoles = (edges: Edges[]): string[] =>
  Array.from(new Set(edges.map(edgeRoleName).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

export const edgeRoleColors = (roles: string[]): Record<string, string> =>
  roles.reduce<Record<string, string>>((colors, role, index) => {
    colors[role] = schemeTableau10[EDGE_SLOTS[index % EDGE_SLOTS.length]];
    return colors;
  }, {});

export const edgeColor = (
  edge: Edges,
  roleColors: Record<string, string>,
): string => roleColors[edgeRoleName(edge)] ?? UNSPECIFIED_EDGE_COLOR;
