import { describe, expect, it } from 'vitest';

import type { Nodes, NodesData } from '@/share/InterfaceTypePastNetworks';
import { createdLabelNodeHover } from '@/utils/functions/createdLabelNodeHover';

const node: Nodes = {
  id: 31,
  uuid: 'owned-voyage',
  node_class: 'voyages',
  source: { id: '31' },
  data: {},
};
const name = 'voyage_ship__ship_name';
const origin = 'voyage_itinerary__imp_principal_place_of_slave_purchase__name';
const destination = 'voyage_itinerary__imp_principal_port_slave_dis__name';
const year = 'voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year';

describe.each(['voyages', 'voyage'])('%s graph labels', (nodeClass) => {
  const label = (data: NodesData) =>
    createdLabelNodeHover({ ...node, node_class: nodeClass, data });

  it('shows just the recorded ship when the API returns null places and year', () => {
    expect(
      label({
        [name]: 'Fictional vessel',
        [origin]: null,
        [destination]: null,
        [year]: null,
      }),
    ).toBe('Fictional vessel');
  });

  it('retains the accepted vessel, route and year format', () => {
    expect(
      label({
        [name]: 'Ship',
        [origin]: 'Luanda',
        [destination]: 'Bahia',
        [year]: 1802,
      }),
    ).toBe('Ship, Luanda to Bahia 1802');
  });

  it('retains both route directions when only one endpoint is known', () => {
    expect(label({ [destination]: 'Bahia', [year]: 1802 })).toBe(
      'unknown to Bahia 1802',
    );
    expect(label({ [origin]: 'Luanda' })).toBe('Luanda to unknown');
  });

  it('shows the recorded year without inventing a route', () => {
    expect(label({ [name]: 'Ship', [year]: 1802 })).toBe('Ship, 1802');
    expect(label({ [year]: 1802 })).toBe('1802');
  });

  it('keeps an unnamed voyage identifiable when all fields are missing', () => {
    expect(label({})).toBe('Unknown voyage');
  });
});
