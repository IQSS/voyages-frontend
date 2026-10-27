/**
 * Mock data for the Pending Enslaver Contributions page.
 * Used while the backend API is under development.
 * Replace with real API calls once the backend is ready.
 */

import { ContributionStatus } from '@slavevoyages/voyages-contribute';

export type EnslaverContribType = 'edit' | 'merge' | 'new' | 'delete';

export interface EnslaverField {
  variable: string;
  original: string;
  contributed: string;
  editor: string;
}

export interface PendingEnslaverContrib {
  id: string;
  type: EnslaverContribType;
  /** Primary enslaver name (Last, First format) */
  enslaver: string;
  /** For merge: the enslaver being merged into `enslaver` */
  enslaverMergeTarget?: string;
  contributor: string;
  timestamp: number;
  status: ContributionStatus;
  notes?: string;
}

const now = Date.now();
const daysAgo = (d: number) => now - d * 86_400_000;

// ── Field comparison helpers ─────────────────────────────────────────────────

const f = (
  variable: string,
  original: string,
  contributed: string,
  editor = contributed,
): EnslaverField => ({ variable, original, contributed, editor });

const same = (variable: string, value: string): EnslaverField =>
  f(variable, value, value, value);

// ── Comparison sections per contribution ─────────────────────────────────────

export interface EnslaverSection {
  title: string;
  fields: EnslaverField[];
}

export const getMockEnslaverSections = (
  contrib: PendingEnslaverContrib,
): EnslaverSection[] => {
  const name = contrib.enslaver;

  if (contrib.type === 'merge') {
    return [
      {
        title: 'Merge Details',
        fields: [
          same('Primary record', name),
          same('Duplicate record', contrib.enslaverMergeTarget ?? '—'),
          same('Action', 'Merge duplicate into primary'),
        ],
      },
      {
        title: 'Primary record fields',
        fields: [
          same('Full name', name),
          same('Aliases', '—'),
          same('Gender', 'Male'),
          same('Birth year', '—'),
          same('Death year', '—'),
          same('Birth place', '—'),
        ],
      },
    ];
  }

  if (contrib.type === 'new') {
    return [
      {
        title: 'New Enslaver',
        fields: [
          f('Full name', '—', name, name),
          f('Aliases', '—', '—', '—'),
          f('Gender', '—', 'Male', 'Male'),
          f('Birth year', '—', '—', '—'),
          f('Death year', '—', '—', '—'),
          f('Birth place', '—', '—', '—'),
          f('Death place', '—', '—', '—'),
          f('Notes', '—', contrib.notes ?? '—', contrib.notes ?? '—'),
        ],
      },
    ];
  }

  if (contrib.type === 'delete') {
    return [
      {
        title: 'Recommended Deletion',
        fields: [
          same('Full name', name),
          same('Reason', contrib.notes ?? 'Duplicate record'),
          same('Action', 'Remove enslaver record'),
        ],
      },
    ];
  }

  // edit
  return [
    {
      title: 'Identity',
      fields: [
        contrib.notes?.includes('name')
          ? f('Full name', name + ' [misspelled]', name, name)
          : same('Full name', name),
        same(
          'Aliases',
          contrib.enslaver.includes('Zwill') ? 'Zwill, Jno' : '—',
        ),
        same('Gender', 'Male'),
      ],
    },
    {
      title: 'Biographical',
      fields: [
        contrib.notes?.includes('birth')
          ? f('Birth year', '1741', '1738', '1738')
          : same('Birth year', '1741'),
        same('Death year', '1803'),
        contrib.notes?.includes('Bristol')
          ? f('Birth place', 'Unknown', 'Bristol, England', 'Bristol, England')
          : same('Birth place', 'Unknown'),
        same('Death place', '—'),
        same('Race / Origin', '—'),
        same('Occupation', 'Merchant'),
      ],
    },
    {
      title: 'Notes',
      fields: [
        contrib.notes
          ? f('Editor notes', '—', contrib.notes, contrib.notes)
          : same('Editor notes', '—'),
      ],
    },
  ];
};

// ── Mock contributions ────────────────────────────────────────────────────────

export const MOCK_ENSLAVER_CONTRIBUTIONS: PendingEnslaverContrib[] = [
  {
    id: 'e-001',
    type: 'edit',
    enslaver: 'Malbone, Evan',
    contributor: 'deltis',
    timestamp: new Date('2023-01-05T18:39:54.202Z').getTime(),
    status: ContributionStatus.Submitted,
    notes: 'Corrected birth year based on Newport town records',
  },
  {
    id: 'e-002',
    type: 'new',
    enslaver: 'Rodrigues, António',
    contributor: 'leong',
    timestamp: new Date('2023-06-05T08:43:21.970Z').getTime(),
    status: ContributionStatus.Submitted,
    notes: 'New enslaver identified from Portuguese Inquisition records',
  },
  {
    id: 'e-003',
    type: 'merge',
    enslaver: 'Zuill, John',
    enslaverMergeTarget: 'Zwill, Jno',
    contributor: 'john.connor.mulligan@gmail.com',
    timestamp: new Date('2024-03-08T19:38:05.187Z').getTime(),
    status: ContributionStatus.Submitted,
    notes: 'Same individual — variant spelling across sources',
  },
  {
    id: 'e-004',
    type: 'merge',
    enslaver: 'Rodriguez, Felix',
    enslaverMergeTarget: 'Rodríguez, Félix',
    contributor: 'mechita',
    timestamp: new Date('2024-03-25T15:30:40.714Z').getTime(),
    status: ContributionStatus.Submitted,
    notes: 'Diacritics inconsistency — same person confirmed in Havana census',
  },
  {
    id: 'e-005',
    type: 'edit',
    enslaver: 'Blanco, Pedro',
    contributor: 'deltis',
    timestamp: new Date('2025-04-18T02:35:08.423Z').getTime(),
    status: ContributionStatus.Submitted,
    notes: 'Corrected Bristol birthplace from primary sources',
  },
  {
    id: 'e-006',
    type: 'edit',
    enslaver: 'DeWolf, James',
    contributor: 'k.hall@emory.edu',
    timestamp: daysAgo(4),
    status: ContributionStatus.Submitted,
    notes: 'Updated occupation and Rhode Island property records reference',
  },
  {
    id: 'e-007',
    type: 'new',
    enslaver: 'Ferreira, Domingos',
    contributor: 'a.ferreira@ufba.br',
    timestamp: daysAgo(6),
    status: ContributionStatus.Submitted,
    notes: 'Identified in Bahia commercial records 1809–1815',
  },
  {
    id: 'e-008',
    type: 'delete',
    enslaver: 'Traill, Robert (duplicate)',
    contributor: 'p.rodrigues@unilisboa.pt',
    timestamp: daysAgo(8),
    status: ContributionStatus.Submitted,
    notes:
      'Duplicate record — same person as Traill, Robert (merchant, Bristol)',
  },
  {
    id: 'e-009',
    type: 'edit',
    enslaver: 'Gomez, Antonio',
    contributor: 'l.garcia@sevilla.es',
    timestamp: daysAgo(10),
    status: ContributionStatus.Submitted,
    notes: 'Corrected name spelling based on Seville notarial records',
  },
  {
    id: 'e-010',
    type: 'merge',
    enslaver: 'Clarkson, John',
    enslaverMergeTarget: 'Clarkson, J.',
    contributor: 'h.davies@bristol.ac.uk',
    timestamp: daysAgo(11),
    status: ContributionStatus.Submitted,
    notes: 'Abbreviated form found in Bristol Merchant Venturers records',
  },
];
