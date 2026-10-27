import {
  AllProperties,
  AllSchemas,
  SchemaIndex,
  SparseDateSchema,
  VoyageSourceSchema,
  VoyageDatesSchema,
  VoyageSchema,
} from '@slavevoyages/voyages-contribute';

let applied = false;

// Section heading for imputation artifacts. Properties with no `section` render
// flat at the top of the form; giving one a section moves it into a collapsible
// panel of that name.
const IMPUTE_SECTION = 'Impute';

// Derived by the imputation script rather than entered by a contributor, so it
// does not belong among the data fields. Named by label because the schema is
// the package's, and labels are what the form groups on.
const IMPUTED_VOYAGE_PROPS = ['Voyage grouping'];

// Date fields in the desired display order — before the length/imputed fields.
const VOYAGE_DATE_FIELDS_ORDER = [
  'voyage_began_sparsedate_id',
  'slave_purchase_began_sparsedate_id',
  'vessel_left_port_sparsedate_id',
  'date_departed_africa_sparsedate_id',
  'first_dis_of_slaves_sparsedate_id',
  'arrival_at_second_place_landing_sparsedate_id',
  'third_dis_of_slaves_sparsedate_id',
  'departure_last_place_of_landing_sparsedate_id',
  'voyage_completed_sparsedate_id',
  'imp_voyage_began_sparsedate_id',
  'imp_arrival_at_port_of_dis_sparsedate_id',
  'imp_departed_africa_sparsedate_id',
];

// Mutates VoyageDatesSchema.properties in-place so date fields appear first
// and length fields (length_middle_passage_days, imp_length_*) follow after.
// Must be called before any Contribute form renders. No-ops after the first run.
export function applySchemaPatches() {
  if (applied) return;

  const props = VoyageDatesSchema.properties;
  const dateFieldSet = new Set(VOYAGE_DATE_FIELDS_ORDER);

  const dateProps = VOYAGE_DATE_FIELDS_ORDER.map((field) =>
    props.find((p) => 'backingField' in p && p.backingField === field),
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  const lengthProps = props.filter(
    (p) => !('backingField' in p) || !dateFieldSet.has(p.backingField),
  );

  props.splice(0, props.length, ...dateProps, ...lengthProps);

  moveVoyagePropsToImputeSection();
  registerSourceDateSchema();
  applied = true;
}

// Moves imputation artifacts out of the ungrouped data fields and into their own
// collapsible section. Silently skips anything it cannot find, so a rename in
// the package degrades to the previous layout rather than a crash.
function moveVoyagePropsToImputeSection() {
  for (const label of IMPUTED_VOYAGE_PROPS) {
    const prop = VoyageSchema.properties.find((p) => p.label === label);
    if (prop) {
      prop.section = IMPUTE_SECTION;
    }
  }
}

// The locked package links document publication dates to voyage sparse dates.
// Django stores these in a separate table; never reuse voyage date IDs here.
function registerSourceDateSchema() {
  let sourceDate = SchemaIndex.SourceDate;
  if (!sourceDate) {
    sourceDate = {
      ...SparseDateSchema,
      name: 'SourceDate',
      backingTable: 'document_docsparsedate',
      properties: SparseDateSchema.properties.map((property) => ({
        ...property,
        schema: 'SourceDate',
        uid: property.uid.replace(/^VoyageSparseDate_/, 'SourceDate_'),
      })),
    };
    AllSchemas.push(sourceDate);
    SchemaIndex.SourceDate = sourceDate;
    for (const property of sourceDate.properties) {
      AllProperties[property.uid] = property;
    }
  }
  const date = VoyageSourceSchema.properties.find(
    (property) => property.label === 'Date',
  );
  if (
    !date ||
    date.kind !== 'linkedEntity' ||
    sourceDate.backingTable !== 'document_docsparsedate'
  ) {
    throw new Error(
      'Source date schema does not match the document date table.',
    );
  }
  // Keep the published property UID so existing source changes remain readable.
  date.linkedEntitySchema = sourceDate.name;
}
