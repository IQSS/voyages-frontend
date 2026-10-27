/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  ChangeSet,
  EntityUpdate,
  getSchema,
  materializeNew,
  PropertyAccessLevel,
} from '@dotproductdev/voyages-contribute';
import { Box, Typography, Button, Pagination } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/style/table.scss';
import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { CustomTablePagination } from '@/styleMUI';

import { ContributionForm } from './ContributionForm';

const tempContrib: EntityUpdate = {
  type: 'update',
  entityRef: {
    id: '500001',
    schema: 'Voyage',
    type: 'new',
  },
  changes: [
    {
      kind: 'direct',
      property: 'Voyage_voyage_id',
      changed: '500001',
    },
    {
      kind: 'direct',
      property: 'Voyage_dataset',
      changed: '3',
    },
    {
      kind: 'owned',
      property: 'Voyage_Ship',
      ownedEntity: {
        entityRef: {
          id: '94182c3c-1c12-48ff-959d-7d3efcca373c',
          schema: 'VoyageShip',
          type: 'new',
        },
        data: {},
        state: 'new',
      },
      changes: [
        {
          kind: 'direct',
          property: 'VoyageShip_ship_name',
          changed: 'Roode Vos',
        },
        {
          kind: 'linked',
          property: 'VoyageShip_nationality_ship_id',
          changed: {
            entityRef: {
              type: 'existing',
              id: 8,
              schema: 'Nationality',
            },
            data: {
              'Nation name': 'Netherlands',
              Code: 8,
              id: 8,
            },
            state: 'lazy',
          },
        },
        {
          kind: 'linked',
          property: 'VoyageShip_rig_of_vessel_id',
          changed: {
            entityRef: {
              type: 'existing',
              id: 53,
              schema: 'RigOfVessel',
            },
            data: {
              'Rig of vessel': 'Galjoot',
              Code: 38,
              id: 53,
            },
            state: 'lazy',
          },
        },
        {
          kind: 'direct',
          property: 'VoyageShip_tonnage',
          changed: '60',
        },
      ],
    },
    {
      kind: 'owned',
      property: 'Voyage_Outcome',
      ownedEntity: {
        entityRef: {
          id: 'bcbdff00-8cdf-43a0-9869-c4abc6c66086',
          schema: 'VoyageOutcome',
          type: 'new',
        },
        data: {},
        state: 'new',
      },
      changes: [
        {
          kind: 'linked',
          property: 'VoyageOutcome_particular_outcome_id',
          changed: {
            entityRef: {
              type: 'existing',
              id: 142,
              schema: 'ParticularOutcome',
            },
            data: {
              Name: 'Left coast with trading cargo intact',
              Value: 41,
              id: 142,
            },
            state: 'lazy',
          },
        },
      ],
    },
    {
      kind: 'owned',
      property: 'Voyage_Itinerary',
      ownedEntity: {
        entityRef: {
          id: '80179e25-af6e-4860-a2fc-1cb8fe24e1c0',
          schema: 'VoyageItinerary',
          type: 'new',
        },
        data: {},
        state: 'new',
      },
      changes: [
        {
          kind: 'linked',
          property: 'VoyageItinerary_int_first_port_emb_id',
          changed: {
            entityRef: {
              type: 'existing',
              id: 1829,
              schema: 'Location',
            },
            data: {
              Name: 'Madagascar',
              Code: 60811,
              id: 1829,
            },
            state: 'lazy',
          },
        },
        {
          kind: 'linked',
          property: 'VoyageItinerary_port_of_departure_id',
          changed: {
            entityRef: {
              type: 'existing',
              id: 1822,
              schema: 'Location',
            },
            data: {
              Name: 'Cape of Good Hope',
              Code: 60803,
              id: 1822,
            },
            state: 'lazy',
          },
        },
      ],
    },
    {
      kind: 'ownedList',
      property: 'Voyage_Enslavement relations',
      removed: [],
      modified: [
        {
          kind: 'owned',
          property: 'Voyage_Enslavement relations',
          ownedEntity: {
            entityRef: {
              id: 'b3d1d073-ad78-46c9-b084-ae5c49a335ae',
              schema: 'EnslavementRelation',
              type: 'new',
            },
            data: {},
            state: 'new',
          },
          changes: [
            {
              kind: 'linked',
              property: 'EnslavementRelation_relation_type_id',
              changed: {
                entityRef: {
                  type: 'existing',
                  id: 1,
                  schema: 'EnslavementRelationType',
                },
                data: {
                  'Relation type': 'Transportation',
                  id: 1,
                },
                state: 'lazy',
              },
            },
            {
              kind: 'ownedList',
              property: 'EnslavementRelation_Enslavers in relation',
              removed: [],
              modified: [
                {
                  kind: 'owned',
                  property: 'EnslavementRelation_Enslavers in relation',
                  ownedEntity: {
                    entityRef: {
                      id: '62775ecb-9479-4756-8c4a-7c52910ec1c1',
                      schema: 'EnslaverInRelation',
                      type: 'new',
                    },
                    data: {},
                    state: 'new',
                  },
                  changes: [
                    {
                      kind: 'linked',
                      property: 'EnslaverInRelation_enslaver_alias_id',
                      changed: {
                        entityRef: {
                          id: 'CanonicalEnslaverAliasId_VOC',
                          schema: 'EnslaverAliasWithIdentity',
                          type: 'new',
                        },
                        data: {},
                        state: 'new',
                      },
                      linkedChanges: [
                        {
                          kind: 'direct',
                          property:
                            'EnslaverAlias_alias_EnslaverAliasWithIdentity',
                          changed: 'VOC',
                        },
                        {
                          kind: 'linked',
                          property: 'EnslaverAliasWithIdentity_identity_id',
                          changed: {
                            entityRef: {
                              id: 'CanonicalEnslaverIdentityId_VOC',
                              schema: 'Enslaver',
                              type: 'new',
                            },
                            data: {},
                            state: 'new',
                          },
                          linkedChanges: [
                            {
                              kind: 'direct',
                              property: 'Enslaver_principal_alias',
                              changed: 'VOC',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      kind: 'ownedList',
                      property: 'EnslaverInRelation_Roles',
                      removed: [],
                      modified: [
                        {
                          kind: 'owned',
                          property: 'EnslaverInRelation_Roles',
                          ownedEntity: {
                            entityRef: {
                              id: '2da11626-69fa-43d6-9a2b-614b6989ea2a',
                              schema: 'EnslaverRelationRoleConn',
                              type: 'new',
                            },
                            data: {},
                            state: 'new',
                          },
                          changes: [
                            {
                              kind: 'linked',
                              property:
                                'EnslaverRelationRoleConn_enslaverrole_id',
                              changed: {
                                entityRef: {
                                  type: 'existing',
                                  id: 4,
                                  schema: 'EnslaverRole',
                                },
                                data: {
                                  'Enslaver role': 'Owner',
                                  id: 4,
                                },
                                state: 'lazy',
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
const _contribs: ChangeSet[] = [tempContrib].map((u) => ({
  id: 1,
  author: 'Mock author',
  title: `Mock Contribution for Voyage #${u.entityRef.id}`,
  changes: [u],
  comments: 'This is a mock contribution for testing purposes.',
  timestamp: new Date().getTime(),
}));
interface TempEditorialPlatProps {
  openSideBar: boolean;
}

export const TempEditorialPlat: React.FC<TempEditorialPlatProps> = ({
  openSideBar,
}) => {
  const [active, setActive] = useState<ChangeSet | undefined>(undefined);
  const [contribs, setContribs] = useState<ChangeSet[]>(_contribs);
  const [page, setPage] = useState(0);
  const [totalResultsCount, setTotalResultsCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const gridRef = useRef<any>(null);

  const columnDefs = [
    {
      headerName: 'Title',
      field: 'title',
      valueGetter: (params: any) => params.data?.title,
      tooltipValueGetter: (params: any) => params.data?.title,
      flex: 1,
    },
    {
      headerName: 'Author',
      field: 'author',
      valueGetter: (params: any) => params.data?.author,
      tooltipValueGetter: (params: any) => params.data?.author,
      flex: 1,
    },
    {
      headerName: 'Comments',
      valueGetter: (params: any) => params.data?.comments,
      tooltipValueGetter: (params: any) => params.data?.comments,
      flex: 1,
    },
    {
      headerName: 'Date',
      field: 'timestamp',
      valueFormatter: ({ value }: { value: number }) =>
        new Date(value).toLocaleDateString(),
      flex: 1,
    },
    {
      headerName: 'Voyage ID',
      valueGetter: (params: any) =>
        params.data?.changes?.[0]?.entityRef?.id || '',
      tooltipValueGetter: (params: any) =>
        `Voyage ID: ${params.data?.changes?.[0]?.entityRef?.id || ''}`,
      flex: 1,
    },
    {
      headerName: 'Ship Name',
      valueGetter: (params: any) => {
        const ship = params.data?.changes?.[0]?.changes?.find(
          (c: any) => c.kind === 'owned' && c.property === 'Voyage_Ship',
        );
        return (
          ship?.changes?.find((s: any) => s.property === 'VoyageShip_ship_name')
            ?.changed || ''
        );
      },
      tooltipValueGetter: (params: any) => {
        const ship = params.data?.changes?.[0]?.changes?.find(
          (c: any) => c.kind === 'owned' && c.property === 'Voyage_Ship',
        );
        return (
          ship?.changes?.find((s: any) => s.property === 'VoyageShip_ship_name')
            ?.changed || '-'
        );
      },
      flex: 1,
    },
    {
      headerName: 'Port of Departure',
      valueGetter: (params: any) => {
        const itinerary = params.data?.changes?.[0]?.changes?.find(
          (c: any) => c.kind === 'owned' && c.property === 'Voyage_Itinerary',
        );
        return (
          itinerary?.changes?.find(
            (c: any) => c.property === 'VoyageItinerary_port_of_departure_id',
          )?.changed?.data?.Name || ''
        );
      },
      tooltipValueGetter: (params: any) => {
        const ship = params.data?.changes?.[0]?.changes?.find(
          (c: any) => c.kind === 'owned' && c.property === 'Voyage_Itinerary',
        );
        return (
          ship?.changes?.find(
            (s: any) => s.property === 'VoyageItinerary_port_of_departure_id',
          )?.changed || '-'
        );
      },
      flex: 1,
    },
  ];

  const empty = useMemo(() => {
    if (!active) return undefined;
    const schema = active.changes[0].entityRef.schema;
    const id = active.changes[0].entityRef.id;
    return materializeNew(getSchema(schema), id);
  }, [active]);

  const datasource = useMemo(
    () => ({
      getRows: async (params: any) => {
        const page = Math.floor(params.startRow / rowsPerPage) + 1;
        try {
          const res = await fetch(
            `${BASEURLNODE}/contributions?page=${page}&limit=${rowsPerPage}`,
          );
          const data = await res.json();
          const rows = data.data.map((c: any) => c.changeSet);
          params.successCallback(rows, data.total);
          setTotalResultsCount(data.total);
          console.log({ rows });
          setContribs(rows);
        } catch (err) {
          console.error('Error fetching data:', err);
          params.failCallback();
        }
      },
    }),
    [rowsPerPage],
  );
  const pageCount = Math.ceil(
    totalResultsCount && rowsPerPage ? totalResultsCount / rowsPerPage : 1,
  );
  const handleBackToTable = () => setActive(undefined);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    gridRef.current?.api.paginationGoToPage(newPage - 1);
  };

  const handleChangePagePagination = (_event: any, newPage: number) => {
    setPage(newPage - 1);
    gridRef.current?.api.paginationGoToPage(newPage - 1);
  };

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newPageSize = parseInt(event.target.value);
      setRowsPerPage(newPageSize);
    },
    [],
  );

  return (
    <Box sx={{ p: 2, width: '100%' }}>
      {active === undefined ? (
        <>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Editorial Contributions
          </Typography>

          <div
            className="ag-theme-alpine"
            style={{
              height: 'calc(90vh - 220px)',
              width: openSideBar
                ? 'calc(100vw - 340px)'
                : 'calc(100vw - 120px)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <AgGridReact<ChangeSet>
              ref={gridRef}
              columnDefs={columnDefs as any}
              defaultColDef={{ flex: 1, minWidth: 100 }}
              rowModelType="infinite"
              datasource={datasource}
              cacheBlockSize={rowsPerPage}
              paginationPageSize={rowsPerPage}
              onRowClicked={({ data }) => setActive(data)}
              theme="legacy"
              pagination={true}
              suppressPaginationPanel={true}
              getRowClass={() => 'custom-pointer-row'}
            />
          </div>
          <div className="tableContainer">
            <CustomTablePagination
              component="div"
              count={totalResultsCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPageOptions={[5, 10, 15, 20, 25, 30, 45, 50, 100]}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
            <div className="pagination-contribute">
              <Pagination
                count={pageCount}
                page={page + 1}
                onChange={handleChangePagePagination}
              />
            </div>
          </div>
        </>
      ) : (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button onClick={handleBackToTable} variant="outlined">
              ← Back to Table
            </Button>
            <Typography variant="h5" sx={{ mt: 2 }}>
              Contribution from {active?.author}
            </Typography>
          </Box>
          <div className="contribute-content">
            {empty && (
              <ContributionForm
                entity={empty}
                changeSet={active}
                onChange={setActive}
                accessLevel={PropertyAccessLevel.Editor}
              />
            )}
          </div>
        </Box>
      )}
    </Box>
  );
};
