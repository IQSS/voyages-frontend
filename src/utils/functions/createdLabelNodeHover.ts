import {
  ENSLAVEDNODE,
  ENSLAVERSNODE,
  VOYAGESNODE,
  ENSLAVEMENTNODE,
  VOYAGESNODECLASS,
} from '@/share/CONST_DATA';
import { Nodes, Edges } from '@/share/InterfaceTypePastNetworks';

export const createdLableNode = (node: Nodes) => {
  const { node_class } = node;
  const {
    documented_name,
    voyage_ship__ship_name: shipName,
    voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year: year,
    principal_alias: alias,
  } = node.data;
  let LableNode;
  if (node_class === ENSLAVEDNODE) {
    LableNode = documented_name;
  } else if (node_class === ENSLAVERSNODE) {
    LableNode = alias;
  } else if (node_class === ENSLAVEMENTNODE) {
    LableNode = '';
  } else if (node_class === VOYAGESNODE || node_class === VOYAGESNODECLASS) {
    LableNode = `${shipName ?? shipName},${year}`;
  }
  return LableNode;
};

export const createdLabelNodeHover = (node: Nodes) => {
  const { node_class } = node;
  const {
    documented_name,
    voyage_ship__ship_name: shipName,
    voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year: year,
    voyage_itinerary__imp_principal_place_of_slave_purchase__name:
      purchaseLocation,
    voyage_itinerary__imp_principal_port_slave_dis__name:
      disembarkationLocation,
    principal_alias: alias,
    relation_type__name,
  } = node.data;
  let LableNode;
  if (node_class === ENSLAVEDNODE) {
    LableNode = documented_name;
  } else if (node_class === ENSLAVERSNODE) {
    LableNode = alias;
  } else if (node_class === ENSLAVEMENTNODE) {
    LableNode = relation_type__name;
  } else if (node_class === VOYAGESNODECLASS || node_class === VOYAGESNODE) {
    const route =
      purchaseLocation || disembarkationLocation
        ? `${purchaseLocation || 'unknown'} to ${disembarkationLocation || 'unknown'}`
        : '';
    const details = [route, year?.toString()].filter(Boolean).join(' ');
    LableNode =
      [shipName, details].filter(Boolean).join(', ') || 'Unknown voyage';
  }
  return LableNode;
};

export const createdLableEdges = (edge: Edges) => {
  let LableNode = '';
  if (edge?.data?.role_name) {
    LableNode = edge.data.role_name;
    return LableNode;
  } else {
    return LableNode;
  }
};

export const createStrokeColor = (edge: Edges) => {
  let colorStork = '#aaa';
  if (edge?.data?.role_name) {
    if (edge?.data?.role_name === 'Captain') {
      colorStork = 'rgb(55, 163, 154)';
    } else if (edge?.data?.role_name === 'Owner') {
      colorStork = '#556cd6';
    } else if (edge?.data?.role_name === 'Consignor') {
      colorStork = 'rgb(31, 120, 180)';
    } else if (edge?.data?.role_name === 'Shipper') {
      colorStork = 'rgb(44, 160, 44)';
    } else if (edge?.data?.role_name === 'Consignor, Shipper') {
      colorStork = 'rgb(255, 127, 14)';
    }
  }
  return colorStork;
};
