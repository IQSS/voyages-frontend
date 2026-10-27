export type CheckboxValueType = string | number | boolean;

export interface Options {
  [key: string]: VoyageOptionsValue;
}
export interface VoyageOptionsValue {
  type: string;
  label: string;
  flatlabel: string;
}

export interface IsShowProp {
  [id: string]: boolean;
}

export interface OptionsDataState {
  value: Record<string, never>;
}

export interface FilterObjectsState {
  rangeValue: RangeSliderMinMaxInitialState;
  loading: boolean;
  error: boolean;
  varName: string;
  isChange?: boolean;
  rangeSliderMinMax: RangeSliderMinMaxInitialState;
  enslaversNameAndRole?: RolesProps[];
  enslaverName: string;
  opsRoles?: string;
  listEnslavers: RolesProps[];
}
export interface FilterMultiselectList {
  multiselectList: MultiselectListProps[];
}
export interface MultiselectListProps {
  id?: number;
  name: string;
  value?: number;
}
export interface RangeSliderMinMaxInitialState {
  [key: string]: number[];
}
export interface AutoCompleteInitialState {
  results: [];
  total_results_count: number;
  autoCompleteValue: Record<string, string[]>;
  autoLabelName: string[];
  textFilterValue: string;
  isChangeAuto: boolean;
  offset: number;
  isLoadingList: boolean;
}

export interface IRootFilterObject {
  varName: string;
  querystr: string;
  offset: number;
  limit: number;
  filter: Filter[];
}
export interface IRootFilterObjectScatterRequest {
  groupby_by: string;
  groupby_cols: string[];
  agg_fn: string;
  cachename: string;
  filter: Filter[];
  global_search?: string;
}

export interface IRootFilterLineAndBarRequest {
  groupby: {
    by: string;
    agg_series: aggSeriesProps[];
  };
  filter: Filter[];
  global_search?: string;
}

export interface aggSeriesProps {
  vals: string;
  agg_fn: string;
}
export interface IRootFilterObjectRequest {
  groupby: {
    by: string;
    vals: string;
    agg_fn: string;
  };
  filter: Filter[];
  global_search?: string;
}
export interface IRootFilterTableObject {
  filter: Filter[];
  page: number;
  page_size: number;
}

export interface Filter {
  varName: string;
  searchTerm:
    | number[]
    | string[]
    | CheckboxValueType[]
    | RolesFilterProps[]
    | CheckboxValueType;
  op: string;
  label?: string;
  title?: string[];
}
export interface FilterEnslavedVoyageOutcomeRequest {
  filter: Filter[];
}

export interface RangeSliderStateProps {
  varName: string;
  filter: Filter[];
}
export interface GeoTreeSelectStateProps {
  geotree_valuefields: string[];
  filter: Filter[];
}
export interface LanguageTreeSelectProps {
  filter: Filter[];
}

export interface AutoCompleteValueInitialState {
  [key: string]: string[];
}

export const TYPES: {
  IntegerField: string;
  DecimalField: string;
  FloatField: string;
  CharField: string;
  GeoTreeSelect: string;
  LanguageTreeSelect: string;
  EnslaverNameAndRole: string;
  IdMatch: string;
  MultiselectList: string;
} = {
  IntegerField: 'IntegerField',
  DecimalField: 'DecimalField',
  FloatField: 'FloatField',
  CharField: 'CharField',
  GeoTreeSelect: 'GeoTreeSelect',
  LanguageTreeSelect: 'LanguageTreeSelect',
  EnslaverNameAndRole: 'EnslaverNameAndRole',
  IdMatch: 'IdMatch',
  MultiselectList: 'MultiselectList',
};

export const TYPESOFDATASETPEOPLE: {
  allEnslaved: string;
  allEnslavers: string;
  africanOrigins: string;
  texas: string;
} = {
  allEnslaved: 'all-enslaved',
  allEnslavers: 'all-enslavers',
  africanOrigins: 'african-origins',
  texas: 'texasEnslaved',
};

export const TYPESOFDATASETENSLAVERS: {
  transAtlanticTrades: string;
  intraAmericanTrades: string;
  enslaver: string;
} = {
  transAtlanticTrades: 'trans-atlantic-trades',
  intraAmericanTrades: 'intra-american-trades',
  enslaver: 'enslaver',
};

export const TYPESOFDATASET: {
  allVoyages: string;
  intraAmerican: string;
  transatlantic: string;
  indianOceanAndAsiaSlaveTrades: string;
  texas: string;
  voyages: string;
  voyage: string;
} = {
  allVoyages: 'all-voyages',
  indianOceanAndAsiaSlaveTrades: 'indian-ocean',
  intraAmerican: 'intra-american',
  transatlantic: 'trans-atlantic',
  texas: 'texas',
  voyages: 'voyages',
  voyage: 'voyage',
};

export const TYPESOFBLOCKVOYAGES: {
  voyagesEN: string;
  voyagesES: string;
  voyagesPT: string;
  summaryStatisticsEN: string;
  summaryStatisticsES: string;
  summaryStatisticsPT: string;
  lineEN: string;
  lineES: string;
  linePT: string;
  barEN: string;
  barES: string;
  barPT: string;
  pieEN: string;
  pieES: string;
  piePT: string;
  tableEN: string;
  tableES: string;
  tablePT: string;
  mapEN: string;
  mapES: string;
  mapPT: string;
  timeLapseEN: string;
  timeLapseES: string;
  timeLapsePT: string;
} = {
  voyagesEN: 'voyages',
  voyagesES: 'viajes',
  voyagesPT: 'viagens',
  summaryStatisticsEN: 'sumstats',
  summaryStatisticsES: 'resuestad',
  summaryStatisticsPT: 'resuestat',
  lineEN: 'line',
  lineES: 'línea',
  linePT: 'linha',
  barEN: 'bar',
  barES: 'barra',
  barPT: 'barra',
  pieEN: 'pie',
  pieES: 'pastel',
  piePT: 'pizza',
  tableEN: 'table',
  tableES: 'tabla',
  tablePT: 'tabela',
  mapEN: 'map',
  mapES: 'mapa',
  mapPT: 'mapa',
  timeLapseEN: 'timelapse',
  timeLapseES: 'líneadetiempo',
  timeLapsePT: 'lapsodetempo',
};

export const TYPESOFBLOCKENSLAVED: {
  enslavedEN: string;
  enslavedES: string;
  enslavedPT: string;
  mapEN: string;
  mapES: string;
  mapPT: string;
} = {
  enslavedEN: 'people',
  enslavedES: 'personas',
  enslavedPT: 'pessoas',
  mapEN: 'map',
  mapES: 'mapa',
  mapPT: 'mapa',
};

export interface AutoCompleteSliceLists {
  results: string[];
  total_results_count: number;
}

export interface AutoCompleteLists {
  results: AutoCompleteOption[];
  total_results_count: number;
}
export interface DataAutoCompleteProp {
  data: DataSuggestedValuesProps;
}

export interface DataSuggestedValuesProps {
  suggested_values: AutoCompleteOption[];
}

export interface AutoCompleteOption {
  value: string;
}
export interface InitialStateFilterMenu {
  value: FilterMenu[];
}

export type VoyagaesFilterMenu = FilterMenu[];

export interface FilterMenu {
  label: LabelFilterMeneList;
  var_name?: string;
  type?: string;
  ops?: string[];
  roles?: RolesProps[];
  flatlabel?: string;
  children?: ChildrenFilter[];
}
export interface RolesProps {
  label: LabelFilterMeneList;
  value: string;
}

export interface RolesFilterProps {
  roles: string[];
  name: string;
}
export interface ChildrenFilter {
  label: LabelFilterMeneList;
  children?: ChildrenFilterArr[];
  var_name?: string;
  type?: string;
  ops?: string[];
  roles?: RolesProps[];
}
export interface ChildrenFilterArr {
  var_name: string;
  type: string;
  label: LabelFilterMeneList;
}

export interface ChildrenNewObjectProp {
  varName?: string;
  subMenu: string | null;
  id: number | null;
  flatlabel?: string | null;
  type?: string | null;
}

export interface VoyageGroupby {
  [key: string]: VoyageGroupbyValue;
}
export interface VoyageGroupbyValue {
  [key: string]: number[];
}

export interface plotXYProps {
  x_vars: PlotXYVar[];
  y_vars: PlotXYVar[];
}

export type LanguageKey = 'en' | 'es' | 'pt';

export interface PlotXYVar {
  var_name: string;
  type?: string;
  label: Record<LanguageKey, string>;
  agg_fn?: string;
}
export interface PlotPieProps {
  x_vars: PlotPIEX[];
  y_vars: PlotPIEY[];
}

export interface PlotPIEX {
  var_name: string;
  label: Record<LanguageKey, string>;
}

export interface PlotPIEY {
  var_name: string;
  label: Record<LanguageKey, string>;
}
export interface BargraphXYVar {
  var_name: string;
  type: string;
  label: Record<LanguageKey, string>;
  agg_fns?: string[];
}

export interface PiegraphXYVar {
  var_name: string;
  type: string;
  label: LabelFilterMeneList;
}

export interface ScatterOptionsXYResponse {
  [key: string]: [];
}
export interface VoyagesOptionProps {
  x_vars: string;
  y_vars: string;
  agg_fn: string;
}

export interface AutocompleteBoxProps {
  value?: AutoCompleteOption[];
}

export interface CurrentPageInitialState {
  currentPage: number;
  isOpenDialog: boolean;
  isOpenDialogMobile: boolean;
  currentVoyageBlockName: string;
}

export interface HeaderNavBarMenuProps {
  window?: () => Window;
}

export interface NavProps {
  window?: () => Window;
}

export interface CascadingMenuProps {
  window?: () => Window;
}

export interface ColumnObjectProps {
  [key: string]: string;
}
export interface TableListPropsRequest {
  filter: Filter[];
  page?: number;
  page_size?: number;
  global_search?: string;
  order_by?: string[];
}
export interface MapPropsRequest {
  zoomlevel?: string;
  filter?: Filter[];
  id?: string;
  global_search?: string;
}
export interface TableColumnProps {
  header_label: string;
  cell_type: string;
  order_by_var: string;
  cell_fields: CellVal;
}

export interface CellVal {
  display: string;
}

export interface InitialStateFilterPeopleMenu {
  value: ValuePeopleFilter;
}
export interface ValuePeopleFilter {
  valueEnslaved: FilterPeopleMenu[];
  valueAfricanOrigin: FilterPeopleMenu[];
  valueTexas: FilterPeopleMenu[];
  valueEnslavers: FilterPeopleMenu[];
}
export type FilterPeopleMenuProps = FilterPeopleMenu[];
export interface FilterPeopleMenu {
  label: LabelFilterMeneList;
  var_name?: string;
  type?: string;
  children?: ChildrenPeopleMenu[];
}

export interface ChildrenPeopleMenu {
  var_name: string;
  type: string;
  label: LabelFilterMeneList;
  flatlabel?: string;
}

export interface PivotTablesPropsRequest {
  columns: string[];
  rows: string;
  rows_label: string;
  agg_fn: string;
  binsize: number;
  value_field: string;
  offset: number;
  limit: number;
  filter: Filter[];
  order_by?: string[];
  global_search?: string;
}

export interface MedatadataProps {
  offset: number;
  limit: number;
  total_results_count: number;
}
export interface PivotTablesProps {
  row_vars: string;
  rows_label: string;
  label: PivotTableLabelProps;
  binsize: number | null;
  column_vars: string[];
  cell_vars: string;
  agg_fn: string;
}
export interface PivotTableLabelProps {
  [key: string]: string;
  en: string;
  es: string;
  pt: string;
}
export interface VoyagesPivotOptionsProps {
  row_vars: PivotRowVar[];
  column_vars: PivotColumnVar[];
  cell_vars: PivotCellVar[];
}

export interface PivotRowVar {
  rows: string;
  binsize: number | null;
  rows_label: string;
  label: LabelFilterMeneList;
}

export interface PivotColumnVar {
  columns: string[];
  label: LabelFilterMeneList;
}
export interface PivotTableResponse {
  tablestructure: Tablestructure[];
  data: any[];
  metadata: Metadata;
}

export interface Tablestructure {
  headerName: string;
  children?: Children[];
  columnGroupShow?: string;
  valueFormatter?: (params: any) => any;
  field?: string;
  filter?: string;
  sort?: string;
  pinned?: string;
  type?: 'rightAligned' | 'leftAligned' | 'centerAligned';
  cellClass?: string;
}

export interface Children {
  columnGroupShow: string;
  headerName: string;
  field: string;
  valueFormatter?: (params: any) => any;
  filter: string;
  sort: string;
  pinned: string;
  type?: 'rightAligned' | 'leftAligned' | 'centerAligned';
  cellClass?: string;
}
export interface Metadata {
  offset: number;
  limit: number;
  total_results_count: number;
}

export interface PivotCellVar {
  value_field: string;
  label: LabelFilterMeneList;
  agg_fn: string;
}
export interface InitialStateTransatlanticCard {
  cardData: Record<string, any>[];
  isModalCard: boolean;
  cardRowID: number;
  cardFileName: string;
  cardDataArray: TransatlanticCardProps[];
  nodeTypeClass: string;
  variable: string;
}
export interface TransatlanticCardProps {
  label: LabelFilterMeneList;
  children: ChildrenCard[];
}
export interface HeaderLabel {
  en: string;
  es: string;
  pt: string;
}

export interface MenuListsProps {
  name: LabelFilterMeneList;
  url?: string;
  isExternal?: boolean;
  submenu?: MenuListsProps[];
}

export interface ChildrenCard {
  cell_type: string;
  cell_val?: CellValCard;
  label: LabelFilterMeneList;
  var_names?: string;
  number_format?: string | number | null;
}

export interface CellValCard {
  fields: FieldCard[];
  join?: string;
}

export interface FieldCard {
  var_name: string;
  cell_fn: string;
  node_class?: string;
}

export interface GeoTreeSelectValueInitialState {
  [key: string]: string[];
}

export interface GeoTreeSelectItem {
  id: number;
  name: string;
  longitude?: string | undefined;
  latitude?: string;
  value: number;
  location_type: LocationType;
  spatial_extent: any;
  children: GeoTreeSelectItem[] | GeoTreeSelectChildren[];
  title?: string;
}
export interface GeoTreeSelectChildren {
  id: number;
  name: string;
  longitude?: string;
  latitude?: string;
  value: number;
  location_type: LocationType;
  spatial_extent: any;
  children: GeoTreeSelectChildren[] | GeoTreeSelectGrandChildren[];
}

export interface GeoTreeSelectGrandChildren {
  id: number;
  name: string;
  longitude: string;
  latitude: string;
  value: number;
  location_type: LocationType;
  spatial_extent: any;
  children: GeoTreeSelectChildren[] | GeoTreeSelectGrandChildren[];
}
export interface TreeSelectItem {
  id: number;
  key: string;
  title: string;
  value: string;
  children?: TreeSelectItem[];
  disabled?: boolean;
}
export interface LanguagesTreeSelectItem {
  name: string;
  id: null | number;
  children: LanguagesTreeSelectItemChildren[];
}
export interface LanguagesTreeSelectItemChildren {
  name: string;
  id: null | number;
}
export interface LanguagesTreeSelectItemList {
  id: number | null;
  value: string;
  title: string;
  children?: LanguagesTreeSelectItemList[];
}
export interface LocationType {
  name: string;
}

export interface TreeSelectItemInitialState {
  geoTreeValue: Record<string, GeoTreeSelectItem[] | string[]>;
  geoTreeSelectValue: string[];
  isChangeGeoTree: boolean;
}

export interface InitialStateFilterMenuProps {
  filterValueList: ValueFilterList;
}

export interface ValueFilterList {
  valueTransaslantic: FilterMenuList[];
  valueIntraamerican: FilterMenuList[];
  valueAllVoyages: FilterMenuList[];
  valueEnslaved: FilterMenuList[];
  valueAfricanOrigin: FilterMenuList[];
  valueEnslavedTexas: FilterMenuList[];
  valueEnslavers: FilterMenuList[];
  valueIndianOceanAndAsiaSlaveTradeDatabase: FilterMenuList[];
}

export interface FilterMenuList {
  label: LabelFilterMeneList;
  var_name?: string;
  type?: string;
  ops?: string[];
  children?: ChildrenFilter[];
}
export interface LabelFilterMeneList {
  [key: string]: string;
  en: string;
  es: string;
  pt: string;
}
export interface LabelTranslations {
  en: string;
  es: string;
  pt: string;
}

export interface KeyTranslations {
  label: LabelTranslations;
}

export interface TranslateType {
  [key: string]: KeyTranslations;
}
export interface FetchAutoVoyageParams {
  varName?: string;
  autoValue?: string;
  offset?: number;
  limit?: number;
}

export interface RenderRowProps {
  data: React.ReactNode[];
  index: number;
  style: React.CSSProperties;
}

export interface EstimateTablesPropsRequest {
  cols?: string[];
  rows: string[];
  binsize: number;
  agg_fn: string;
  vals?: string[];
  mode: string;
  filter: Filter[];
}
export interface EstimateTablesProps {
  row_vars: EstimateRowVar[];
  column_vars: EstimateColumnVar[];
  cell_vars: EstimateCellVar[];
}

export interface EstimateOptionProps {
  rows: string[];
  binsize: number | null;
  rows_label: string;
  label: EstimateLabelProps;
  column_vars: string[];
  cell_vars: string[];
}
export interface EstimateRowVar {
  rows: string[];
  binsize?: number;
  rows_label: string;
  label: EstimateLabelProps;
}
export interface EstimateLabelProps {
  [key: string]: string;
  en: string;
  es: string;
  pt: string;
}

export interface EstimateColumnVar {
  cols: string[];
  label: EstimateLabelProps;
}

export interface EstimateCellVar {
  vals: string[];
  label: EstimateLabelProps; //string
}

export interface InitialStateDataEstimateAssesment {
  selectedFlags: CheckboxValueType[];
  currentSliderValue: number[];
  changeFlag: boolean;
  checkedListEmbarkation: Record<string, CheckboxValueType[]>;
  checkedListDisEmbarkation: Record<string, CheckboxValueType[]>;
}

export interface CheckboxGroupItem {
  label: string;
  plainOptions: string[];
  setCheckedList:
    | React.Dispatch<React.SetStateAction<CheckboxValueType[]>>
    | ((list: CheckboxValueType[]) => void);
  checkedList: CheckboxValueType[];
  show: boolean;
  varName: string;
}
export interface ListRegionsProps {
  label: string;
  show: boolean;
  varName: string;
  checkName: string;
  options: string[];
}

export interface TimeLineResponse {
  disembarked_slaves: number[];
  embarked_slaves: number[];
  year: number[];
}
export interface TimeLineGraphRequest {
  filter?: Filter[];
}

export interface CreateAQueryLinkRequest {
  filter?: Filter[];
}

export interface DataTimeLinesItem {
  x: number;
  y0: number;
  y1: number;
  [key: string]: number;
}

export interface LayerTimeLinesItem {
  x: number;
  y: number;
  embarked: number;
  disembarked: number;
  y1: number;
  y0: number;
}
export type EventsTimeLinesType = {
  [key: string]: string;
};

export interface ElementTimeLine {
  counter: number;
  year: string;
  label: string;
  index: number;
}

export interface SummaryStatisticsTableRequest {
  mode: string;
  filter: Filter[];
  global_search?: string;
}

export interface SaveSearchRequest {
  endpoint: string;
  front_end_path: string;
  query: Filter[];
}

export interface ContribuitLocation {
  id: number
  name: string
  longitude?: number
  latitude?: number
  value: number
  location_type: LocationType
  spatial_extent: any
  children: Children[]
}

export interface LocationType {
  name: string
}

export interface Children {
  id: number
  name: string
  longitude?: number
  latitude?: number
  value: number
  location_type: LocationType2
  spatial_extent: any
  children: Children2[]
}

export interface LocationType2 {
  name: string
}

export interface Children2 {
  id: number
  name: string
  longitude?: number
  latitude?: number
  value: number
  location_type: LocationType3
  spatial_extent: any
}

export interface LocationType3 {
  name: string
}
