export const CARD_NODE_CLASSES = [
  'voyage',
  'voyages',
  'enslaved',
  'enslaver',
  'enslavers',
] as const;

export type CardNodeClass = (typeof CARD_NODE_CLASSES)[number];

export interface CardTarget {
  id: number;
  nodeClass: CardNodeClass;
}

export interface ResolveCardTargetInput {
  clickedValue: unknown;
  rowId: unknown;
  explicitNodeClass?: string;
  pageNodeClass: string;
}

const cardNodeClasses = new Set<string>(CARD_NODE_CLASSES);

export const normalizeCardTargetId = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

export const normalizeCardNodeClass = (value: unknown): CardNodeClass | null =>
  typeof value === 'string' && cardNodeClasses.has(value)
    ? (value as CardNodeClass)
    : null;

export const normalizeCardTarget = (value: {
  id: unknown;
  nodeClass: unknown;
}): CardTarget | null => {
  const id = normalizeCardTargetId(value.id);
  const nodeClass = normalizeCardNodeClass(value.nodeClass);
  return id !== null && nodeClass !== null ? { id, nodeClass } : null;
};

export const resolveCardTarget = ({
  clickedValue,
  rowId,
  explicitNodeClass,
  pageNodeClass,
}: ResolveCardTargetInput): CardTarget | null => {
  const hasExplicitTarget = explicitNodeClass !== undefined;
  const id = normalizeCardTargetId(hasExplicitTarget ? clickedValue : rowId);
  const nodeClass = normalizeCardNodeClass(
    hasExplicitTarget ? explicitNodeClass : pageNodeClass,
  );

  return id !== null && nodeClass !== null ? { id, nodeClass } : null;
};

export type CardTargetKind = 'voyage' | 'enslaved' | 'enslaver';

export const getCardTargetKind = (nodeClass: CardNodeClass): CardTargetKind => {
  switch (nodeClass) {
    case 'voyage':
    case 'voyages':
      return 'voyage';
    case 'enslaved':
      return 'enslaved';
    case 'enslaver':
    case 'enslavers':
      return 'enslaver';
  }
};
