/**
 * Mock data for the Pending Contributions page.
 * Used while the backend API is under development.
 * Replace calls to this file with real API calls once the backend is ready.
 *
 * Extra display fields (year, exported, imported, majorPlaceOfPurchase,
 * majorPlaceOfLanding) are stored in `changeSet.changes` metadata on the
 * real API; here they're added as top-level fields on the mock objects via
 * intersection type so the column valueGetters can read them easily.
 */

import { ContributionStatus } from '@slavevoyages/voyages-contribute';

import { TransformedContribution } from '../utils/transformContributionData';

// Extra display-only fields that the pending table needs.
export interface PendingDisplayFields {
  year?: number | string;
  exported?: number | string;
  imported?: number | string;
  majorPlaceOfPurchase?: string;
  majorPlaceOfLanding?: string;
}

export type PendingContribution = TransformedContribution &
  PendingDisplayFields;

const now = Date.now();
const daysAgo = (days: number) => now - days * 24 * 60 * 60 * 1000;

// ── Voyage section comparison data for the editor drawer ────────────────────

export interface VoyageField {
  variable: string;
  original: string;
  contributed: string;
  editor: string;
}

export interface VoyageSection {
  title: string;
  fields: VoyageField[];
}

const field = (
  variable: string,
  original: string,
  contributed: string,
  editor = contributed,
): VoyageField => ({ variable, original, contributed, editor });

const same = (variable: string, value: string): VoyageField =>
  field(variable, value, value, value);

export const getMockVoyageSections = (
  contrib: PendingContribution,
): VoyageSection[] => {
  const ship = contrib.shipName ?? '—';
  const nation = contrib.nationality ?? '—';
  const yr = contrib.year?.toString() ?? '—';
  const purchase = contrib.majorPlaceOfPurchase ?? '—';
  const landing = contrib.majorPlaceOfLanding ?? '—';
  const exported_ = contrib.exported?.toString() ?? '—';
  const imported_ = contrib.imported?.toString() ?? '—';
  const title = (contrib.changeSet?.title ?? '').toLowerCase();

  // Derive contextual "changed" fields from the contribution title
  const shipChanged =
    title.includes('ship name') || title.includes('name of vessel');
  const ownerChanged = title.includes('owner');
  const tonnageChanged = title.includes('tonnage') || title.includes('rig');
  const disembChanged =
    title.includes('disembarkation') ||
    title.includes('landing') ||
    title.includes('arrival');
  const embarked =
    title.includes('embarkation') ||
    title.includes('enslaved') ||
    title.includes('number');
  const dateChanged =
    title.includes('year') ||
    title.includes('departure') ||
    title.includes('date');

  return [
    {
      title: 'Ship, nation, owners',
      fields: [
        shipChanged
          ? field('Name of vessel', ship + ' (old spelling)', ship, ship)
          : same('Name of vessel', ship),
        same('Place where ship constructed', purchase),
        same('Place where ship registered', purchase),
        same('Year of ship construction', String(Number(yr) - 1 || yr)),
        same('Year of ship registration', yr),
        same('National carrier', nation),
        tonnageChanged
          ? field('Rig of vessel', 'Bark', 'Brigantine', 'Brigantine')
          : same('Rig of vessel', 'Brigantine'),
        tonnageChanged
          ? field('Tonnage of vessel', '180', '215', '215')
          : same('Tonnage of vessel', '180'),
        same('Guns mounted', '4'),
        ownerChanged
          ? field(
            'First or managing owner of venture',
            'Unknown',
            'Robert Traill',
            'Robert Traill',
          )
          : same('First or managing owner of venture', 'Various merchants'),
      ],
    },
    {
      title: 'Slave (captive) numbers',
      fields: [
        embarked
          ? field(
            'Total embarked',
            String(Number(exported_) - 32),
            exported_,
            exported_,
          )
          : same('Total embarked', exported_),
        embarked
          ? field(
            'Total disembarked',
            String(Number(imported_) - 25),
            imported_,
            imported_,
          )
          : same('Total disembarked', imported_),
        same(
          'Deaths in Middle Passage',
          String(Number(exported_) - Number(imported_)),
        ),
      ],
    },
    {
      title: 'Voyage outcome',
      fields: [
        same('Outcome of voyage', 'Arrived with captives, homeward bound'),
      ],
    },
    {
      title: 'Voyage itinerary',
      fields: [
        disembChanged
          ? field(
            'First port of intended disembarkation',
            'Martinique',
            landing,
            landing,
          )
          : same('First port of intended disembarkation', landing),
        same('First place of slave purchase', purchase),
        same('Principal place of slave purchase', purchase),
      ],
    },
    {
      title: 'Voyage dates',
      fields: [
        dateChanged
          ? field('Year of departure', String(Number(yr) + 1), yr, yr)
          : same('Year of departure', yr),
        same('Date that slave purchase began', `Jan ${yr}`),
        same('Date that vessel left last slaving port', `Jun ${yr}`),
        same('Year of arrival at port of disembarkation', yr),
      ],
    },
  ];
};

export const MOCK_PENDING_CONTRIBUTIONS: PendingContribution[] = [
  {
    id: 'mock-contrib-001',
    root: { type: 'existing', schema: 'Voyage', id: 11586 },
    changeSet: {
      id: 'mock-cs-001',
      author: 'p.rodrigues@unilisboa.pt',
      title: 'Correction to ship name and departure date',
      comments:
        'Found primary source evidence that the ship name was misspelled. Also corrected departure date from Lisbon based on port records.',
      timestamp: daysAgo(2),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 1, title: 'Batch Q1 2026', comments: '', published: null },
    changeSetId: 'mock-cs-001',
    voyage_id: 11586,
    shipName: 'São João Baptista',
    nationality: 'Portuguese',
    type: 'existing',
    year: 1727,
    exported: 340,
    imported: 291,
    majorPlaceOfPurchase: 'Luanda',
    majorPlaceOfLanding: 'Bahia',
  },
  {
    id: 'mock-contrib-002',
    root: { type: 'new', schema: 'Voyage', id: 99001 },
    changeSet: {
      id: 'mock-cs-002',
      author: 'h.davies@bristol.ac.uk',
      title: 'New voyage: Bristol merchant vessel 1742',
      comments:
        'Newly discovered voyage from Bristol Records Office. Ship departed Bristol in 1742 bound for the Gold Coast.',
      timestamp: daysAgo(5),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 1, title: 'Batch Q1 2026', comments: '', published: null },
    changeSetId: 'mock-cs-002',
    voyage_id: 99001,
    shipName: 'The Providence',
    nationality: 'British',
    type: 'new',
    year: 1742,
    exported: 210,
    imported: 188,
    majorPlaceOfPurchase: 'Gold Coast',
    majorPlaceOfLanding: 'Jamaica',
  },
  {
    id: 'mock-contrib-003',
    root: { type: 'existing', schema: 'Voyage', id: 8823 },
    changeSet: {
      id: 'mock-cs-003',
      author: 'm.vandenberg@leiden.nl',
      title: 'Update tonnage and captain name',
      comments:
        'Dutch East India Company records confirm captain was Jan de Vries, not Pieter Jansen as listed.',
      timestamp: daysAgo(3),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: undefined,
    changeSetId: 'mock-cs-003',
    voyage_id: 8823,
    shipName: 'De Goede Hoop',
    nationality: 'Dutch',
    type: 'existing',
    year: 1768,
    exported: 415,
    imported: 372,
    majorPlaceOfPurchase: 'Bight of Benin',
    majorPlaceOfLanding: 'Suriname',
  },
  {
    id: 'mock-contrib-004',
    root: { type: 'existing', schema: 'Voyage', id: 14200 },
    changeSet: {
      id: 'mock-cs-004',
      author: 'c.moreau@paris-sorbonne.fr',
      title: 'Corrected port of disembarkation',
      comments:
        'Port of disembarkation should be Saint-Domingue, not Martinique. Verified with French colonial records from ANOM.',
      timestamp: daysAgo(7),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 2, title: 'Batch Q2 2026', comments: '', published: null },
    changeSetId: 'mock-cs-004',
    voyage_id: 14200,
    shipName: 'Le Marquis de Tourny',
    nationality: 'French',
    type: 'existing',
    year: 1754,
    exported: 290,
    imported: 261,
    majorPlaceOfPurchase: 'Senegambia',
    majorPlaceOfLanding: 'Saint-Domingue',
  },
  {
    id: 'mock-contrib-005',
    root: { type: 'existing', schema: 'Voyage', id: 7710 },
    changeSet: {
      id: 'mock-cs-005',
      author: 'l.garcia@sevilla.es',
      title: 'Number of enslaved persons — embarkation correction',
      comments:
        'Original Spanish manifests show 312 embarked, not 280 as currently listed. Uploading scan of manifest as supporting document.',
      timestamp: daysAgo(1),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: undefined,
    changeSetId: 'mock-cs-005',
    voyage_id: 7710,
    shipName: 'Nuestra Señora del Rosario',
    nationality: 'Spanish',
    type: 'existing',
    year: 1783,
    exported: 312,
    imported: 278,
    majorPlaceOfPurchase: 'Congo North',
    majorPlaceOfLanding: 'Havana',
  },
  {
    id: 'mock-contrib-006',
    root: { type: 'new', schema: 'Voyage', id: 99002 },
    changeSet: {
      id: 'mock-cs-006',
      author: 'r.smallwood@unc.edu',
      title: 'New voyage: Liverpool to Gold Coast, 1783',
      comments:
        'Discovered in Liverpool Customs records. Previously uncatalogued voyage departing Liverpool for Anomabo, 1783.',
      timestamp: daysAgo(10),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 1, title: 'Batch Q1 2026', comments: '', published: null },
    changeSetId: 'mock-cs-006',
    voyage_id: 99002,
    shipName: 'Enterprize',
    nationality: 'British',
    type: 'new',
    year: 1783,
    exported: 176,
    imported: 155,
    majorPlaceOfPurchase: 'Gold Coast',
    majorPlaceOfLanding: 'Barbados',
  },
  {
    id: 'mock-contrib-007',
    root: { type: 'existing', schema: 'Voyage', id: 20451 },
    changeSet: {
      id: 'mock-cs-007',
      author: 'a.ferreira@ufba.br',
      title: 'Corrected arrival port in Brazil',
      comments:
        'Ship arrived at Bahia, not Rio de Janeiro. Brazilian newspaper records from 1810 and ANTT colonial records confirm this.',
      timestamp: daysAgo(4),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 2, title: 'Batch Q2 2026', comments: '', published: null },
    changeSetId: 'mock-cs-007',
    voyage_id: 20451,
    shipName: 'Bom Jesús',
    nationality: 'Portuguese',
    type: 'existing',
    year: 1810,
    exported: 502,
    imported: 448,
    majorPlaceOfPurchase: 'Mozambique',
    majorPlaceOfLanding: 'Bahia',
  },
  {
    id: 'mock-contrib-008',
    root: { type: 'existing', schema: 'Voyage', id: 9942 },
    changeSet: {
      id: 'mock-cs-008',
      author: 'k.hall@emory.edu',
      title: 'Owner identification — James DeWolf',
      comments:
        'Updated vessel owner from "Unknown" to James DeWolf based on Bristol county probate records, Rhode Island.',
      timestamp: daysAgo(6),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: undefined,
    changeSetId: 'mock-cs-008',
    voyage_id: 9942,
    shipName: 'Charlotte',
    nationality: 'British',
    type: 'existing',
    year: 1801,
    exported: 244,
    imported: 211,
    majorPlaceOfPurchase: 'Sierra Leone',
    majorPlaceOfLanding: 'South Carolina',
  },
  {
    id: 'mock-contrib-009',
    root: { type: 'existing', schema: 'Voyage', id: 17334 },
    changeSet: {
      id: 'mock-cs-009',
      author: 'n.klein@hamburg-uni.de',
      title: 'Rig type and tonnage correction',
      comments:
        'Ship was a brig, not a bark. Updated tonnage from 180 to 215 based on Hamburger Zeitung shipping reports.',
      timestamp: daysAgo(8),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 1, title: 'Batch Q1 2026', comments: '', published: null },
    changeSetId: 'mock-cs-009',
    voyage_id: 17334,
    shipName: 'Minerva',
    nationality: 'Dutch',
    type: 'existing',
    year: 1791,
    exported: 388,
    imported: 341,
    majorPlaceOfPurchase: 'Bight of Biafra',
    majorPlaceOfLanding: 'Suriname',
  },
  {
    id: 'mock-contrib-010',
    root: { type: 'new', schema: 'Voyage', id: 99003 },
    changeSet: {
      id: 'mock-cs-010',
      author: 'd.eltis@emory.edu',
      title: 'New intra-American voyage: Cuba to New Orleans, 1820',
      comments:
        'Internal transfer voyage from Havana to New Orleans, 1820. Found in New Orleans Probate Court records and La Gazette de la Louisiane.',
      timestamp: daysAgo(12),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 2, title: 'Batch Q2 2026', comments: '', published: null },
    changeSetId: 'mock-cs-010',
    voyage_id: 99003,
    shipName: 'Franklin',
    nationality: 'American',
    type: 'new',
    year: 1820,
    exported: 98,
    imported: 94,
    majorPlaceOfPurchase: 'Cuba',
    majorPlaceOfLanding: 'New Orleans',
  },
  {
    id: 'mock-contrib-011',
    root: { type: 'existing', schema: 'Voyage', id: 5501 },
    changeSet: {
      id: 'mock-cs-011',
      author: 'i.donnan@cambridge.ac.uk',
      title: 'Middle Passage mortality — death toll correction',
      comments:
        'Ship log shows 47 deaths during Middle Passage, not 12 as listed. Original log held at the National Archives, Kew (HCA 30/847).',
      timestamp: daysAgo(14),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: undefined,
    changeSetId: 'mock-cs-011',
    voyage_id: 5501,
    shipName: 'Hannibal',
    nationality: 'British',
    type: 'existing',
    year: 1693,
    exported: 700,
    imported: 372,
    majorPlaceOfPurchase: 'Gold Coast',
    majorPlaceOfLanding: 'Barbados',
  },
  {
    id: 'mock-contrib-012',
    root: { type: 'existing', schema: 'Voyage', id: 31002 },
    changeSet: {
      id: 'mock-cs-012',
      author: 't.voyageresearch@slavevoyages.org',
      title: 'Year of departure correction — 1798 vs 1799',
      comments:
        'Vessel departed 1798, not 1799 as listed. Portuguese maritime records from Arquivo Nacional da Torre do Tombo confirm the earlier date.',
      timestamp: daysAgo(9),
      changes: [],
    },
    status: ContributionStatus.Submitted,
    reviews: [],
    media: [],
    batch: { id: 1, title: 'Batch Q1 2026', comments: '', published: null },
    changeSetId: 'mock-cs-012',
    voyage_id: 31002,
    shipName: 'Nossa Senhora da Conceição',
    nationality: 'Portuguese',
    type: 'existing',
    year: 1798,
    exported: 460,
    imported: 409,
    majorPlaceOfPurchase: 'Luanda',
    majorPlaceOfLanding: 'Rio de Janeiro',
  },
];
