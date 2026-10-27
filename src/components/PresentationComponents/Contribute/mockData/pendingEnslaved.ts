/**
 * Mock data for the Pending Enslaved Contributions page.
 * Used while the backend API is under development.
 * Replace with real API calls once the backend is ready.
 */

import { ContributionStatus } from '@slavevoyages/voyages-contribute';

export type EnslavedContribType = 'edit' | 'new';

export interface EnslavedField {
  variable: string;
  original: string;
  contributed: string;
  editor: string;
}

export interface EnslavedSection {
  title: string;
  fields: EnslavedField[];
}

export interface PendingEnslavedContrib {
  id: string;
  type: EnslavedContribType;
  /** Enslaved person name */
  name: string;
  /** Linked voyage ID */
  voyageId?: number;
  /** Ship name */
  shipName?: string;
  contributor: string;
  timestamp: number;
  status?: ContributionStatus;
  /** Notes or details of the contribution */
  notes?: string;

  /** For table display: enslaved person name */
  enslaved: string;
  /** For table display: what names were contributed */
  contributed?: string;
  /** For table display: languages of contribution */
  languages?: string;
}

const now = Date.now();
const daysAgo = (d: number) => now - d * 86_400_000;

// ── Field helpers ─────────────────────────────────────────────────────────────

const f = (
  variable: string,
  original: string,
  contributed: string,
  editor = contributed,
): EnslavedField => ({ variable, original, contributed, editor });

const same = (variable: string, value: string): EnslavedField =>
  f(variable, value, value, value);

// ── Comparison sections ───────────────────────────────────────────────────────

export const getMockEnslavedSections = (
  contrib: PendingEnslavedContrib,
): EnslavedSection[] => {
  const isNew = contrib.type === 'new';

  return [
    {
      title: 'Identity',
      fields: [
        isNew
          ? f('Name', '—', contrib.name, contrib.name)
          : contrib.notes?.includes('name')
            ? f('Name', contrib.name + ' [variant]', contrib.name, contrib.name)
            : same('Name', contrib.name),
        same('Gender', 'Male'),
        same('Age at embarkation', '—'),
        same('Height (inches)', '—'),
        same('Skin color', '—'),
      ],
    },
    {
      title: 'Origin',
      fields: [
        same('African origin', '—'),
        same('Language group', '—'),
        same('Country of origin', '—'),
        isNew
          ? f('Port of embarkation', '—', 'Luanda', 'Luanda')
          : same('Port of embarkation', 'Luanda'),
      ],
    },
    {
      title: 'Voyage',
      fields: [
        same('Voyage ID', String(contrib.voyageId ?? '—')),
        same('Ship name', contrib.shipName ?? '—'),
        same('Year of voyage', '—'),
        same('Port of disembarkation', '—'),
      ],
    },
    {
      title: 'Notes',
      fields: [
        contrib.notes
          ? f('Contributor notes', '—', contrib.notes, contrib.notes)
          : same('Contributor notes', '—'),
      ],
    },
  ];
};

// ── Mock data ─────────────────────────────────────────────────────────────────
export const MOCK_ENSLAVED_CONTRIBUTIONS: PendingEnslavedContrib[] = [
  {
    id: 'sl-001',
    type: 'edit',
    enslaved: 'Cudjoe',
    contributor: 'p.rodrigues@unilisboa.pt',
    timestamp: daysAgo(1),
    contributed: 'Corrected name spelling from "Cujo"',
    languages: 'Portuguese',
    name: 'Cudjoe',
  },
  {
    id: 'sl-002',
    type: 'new',
    enslaved: 'Aminata',
    contributor: 'm.vandenberg@leiden.nl',
    timestamp: daysAgo(3),
    contributed: 'Identified in Dutch colonial records, Suriname 1768',
    languages: 'Dutch',
    name: 'Aminata',
  },
  {
    id: 'sl-003',
    type: 'new',
    enslaved: 'Prince',
    contributor: 'k.hall@emory.edu',
    timestamp: daysAgo(4),
    contributed:
      'Age at embarkation corrected to 14 based on plantation records',
    languages: 'English',
    name: 'Prince',
  },
  {
    id: 'sl-004',
    type: 'edit',
    enslaved: 'Fatima',
    contributor: 'c.moreau@paris-sorbonne.fr',
    timestamp: daysAgo(5),
    contributed: 'Name and origin from ANOM colonial records, Saint-Domingue',
    languages: 'French',
    name: '',
  },
  {
    id: 'sl-005',
    type: 'new',
    enslaved: 'Venture',
    contributor: 'i.donnan@cambridge.ac.uk',
    timestamp: daysAgo(6),
    contributed: 'Port of embarkation corrected to Gold Coast',
    languages: 'English',
    name: '',
  },
  {
    id: 'sl-006',
    type: 'new',
    enslaved: 'Isata',
    contributor: 'r.smallwood@unc.edu',
    timestamp: daysAgo(7),
    contributed:
      'Sierra Leone origin, identified from Liberated African register',
    languages: 'English',
    name: '',
  },
  {
    id: 'sl-007',
    type: 'new',
    enslaved: 'Kofi',
    contributor: 'n.klein@hamburg-uni.de',
    timestamp: daysAgo(8),
    contributed: 'Corrected gender and age from Suriname estate records',
    languages: 'German',
    name: '',
  },
  {
    id: 'sl-008',
    type: 'new',
    enslaved: 'Maria de Conceição',
    contributor: 'a.ferreira@ufba.br',
    timestamp: daysAgo(9),
    contributed: 'Identified in Bahia baptism records 1811',
    languages: 'Portuguese',
    name: '',
  },
  {
    id: 'sl-009',
    type: 'new',
    enslaved: 'Quobna',
    contributor: 'l.garcia@sevilla.es',
    timestamp: daysAgo(10),
    contributed: 'Name variant confirmed in Havana notarial records',
    languages: 'Spanish',
    name: '',
  },
  {
    id: 'sl-010',
    type: 'new',
    enslaved: 'Phillis',
    contributor: 'h.davies@bristol.ac.uk',
    timestamp: daysAgo(12),
    contributed: 'Newly identified from Bristol port records, 1742',
    languages: 'English',
    name: '',
  },
  {
    id: 'sl-011',
    type: 'new',
    enslaved: 'Toussaint',
    contributor: 't.voyageresearch@slavevoyages.org',
    timestamp: daysAgo(14),
    contributed: 'Skin color description corrected from Portuguese manifest',
    languages: 'Portuguese',
    name: '',
  },
  {
    id: 'sl-012',
    type: 'new',
    enslaved: 'Adwoa',
    contributor: 'd.eltis@emory.edu',
    timestamp: daysAgo(15),
    contributed: 'Identified in New Orleans probate records 1820',
    languages: 'English',
    name: '',
  },
];
