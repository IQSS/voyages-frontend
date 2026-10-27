/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { Button, Checkbox, message, Select, Space } from 'antd';

import { fetchContributionsData } from '@/fetch/contributeFetch/fetchContributionsData';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import { statusConfig } from '../commons/StatusCellRenderer';
import { mapVoyageRow, VoyageRow } from '../utils/editorialRowMappers';

const BLOCK = 100;

// The statuses offered as download filters, in the order the legacy page lists
// them, labelled from the shared statusConfig.
const STATUS_OPTIONS: { value: ContributionStatus; label: string }[] = [
  {
    value: ContributionStatus.Submitted,
    label: statusConfig[ContributionStatus.Submitted].label,
  },
  {
    value: ContributionStatus.WorkInProgress,
    label: statusConfig[ContributionStatus.WorkInProgress].label,
  },
  {
    value: ContributionStatus.Rejected,
    label: statusConfig[ContributionStatus.Rejected].label,
  },
  {
    value: ContributionStatus.Accepted,
    label: statusConfig[ContributionStatus.Accepted].label,
  },
  {
    value: ContributionStatus.Published,
    label: statusConfig[ContributionStatus.Published].label,
  },
];

// Published is left out of the default set, matching the legacy page.
const DEFAULT_STATUSES = [
  ContributionStatus.Submitted,
  ContributionStatus.WorkInProgress,
  ContributionStatus.Rejected,
  ContributionStatus.Accepted,
];

const CSV_COLUMNS: { header: string; get: (r: VoyageRow) => any }[] = [
  { header: 'Voyage ID', get: (r) => r.voyage_id },
  { header: 'Type', get: (r) => (r.type === 'new' ? 'New' : 'Edit') },
  { header: 'Ship', get: (r) => r.shipName },
  { header: 'Year', get: (r) => r.year },
  { header: 'Nation', get: (r) => r.nationality },
  { header: 'Exported', get: (r) => r.exported },
  { header: 'Imported', get: (r) => r.imported },
  { header: 'Major place of purchase', get: (r) => r.majorPlaceOfPurchase },
  { header: 'Major place of landing', get: (r) => r.majorPlaceOfLanding },
  { header: 'Contributor', get: (r) => r.changeSet?.author },
  {
    header: 'Status',
    get: (r) => statusConfig[r.status as ContributionStatus]?.label ?? r.status,
  },
  {
    header: 'Date',
    get: (r) => (r.timestamp ? new Date(r.timestamp).toISOString() : ''),
  },
];

// Read a voyage's dataset (0 = Trans-Atlantic, 1 = Intra-American) from the
// changeSet, when the contribution set it. Absent on edits that didn't.
const readDataset = (c: any): string | undefined => {
  const changes = c?.changeSet?.changes?.[0]?.changes ?? [];
  const hit = changes.find(
    (ch: any) => ch?.kind === 'direct' && ch?.property === 'Voyage_dataset',
  );
  return hit?.changed != null ? String(hit.changed) : undefined;
};

const csvCell = (value: any, removeLineBreaks: boolean): string => {
  let s = value == null ? '' : String(value);
  if (removeLineBreaks) s = s.replace(/\r\n|\r|\n/g, ' ');
  // Always quote and escape, so commas/quotes in the data cannot break columns.
  return `"${s.replace(/"/g, '""')}"`;
};

const triggerDownload = (csv: string, filename: string) => {
  // Prepend a BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const DownloadVoyages: React.FC = () => {
  const [statuses, setStatuses] =
    useState<ContributionStatus[]>(DEFAULT_STATUSES);
  const [dataset, setDataset] = useState<'both' | '0' | '1'>('both');
  const [removeLineBreaks, setRemoveLineBreaks] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const toggle = useCallback((value: ContributionStatus, checked: boolean) => {
    setStatuses((prev) =>
      checked ? [...prev, value] : prev.filter((s) => s !== value),
    );
  }, []);

  const selectAll = useCallback(
    () => setStatuses(STATUS_OPTIONS.map((o) => o.value)),
    [],
  );
  const clear = useCallback(() => setStatuses([]), []);

  const canDownload = useMemo(
    () => statuses.length > 0 && !downloading,
    [statuses.length, downloading],
  );

  const handleDownload = useCallback(async () => {
    if (statuses.length === 0) {
      message.warning('Select at least one status.');
      return;
    }
    setDownloading(true);
    const hide = message.loading('Preparing download…', 0);
    try {
      const params = new URLSearchParams();
      params.set('root_schema', 'Voyage');
      statuses.forEach((s) => params.append('status', String(s)));
      const filterQuery = params.toString();

      const rows: VoyageRow[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await fetchContributionsData(page, BLOCK, filterQuery);
        const data: any[] = res?.data ?? [];
        totalPages =
          res?.totalPages ?? (res?.total ? Math.ceil(res.total / BLOCK) : page);
        for (const c of data) {
          if (dataset !== 'both') {
            const ds = readDataset(c);
            // Only keep rows we can confirm match the chosen dataset.
            if (ds !== dataset) continue;
          }
          rows.push(mapVoyageRow(c));
        }
        page += 1;
      } while (page <= totalPages);

      if (rows.length === 0) {
        hide();
        message.info('No contributions match the selected filters.');
        return;
      }

      const header = CSV_COLUMNS.map((c) =>
        csvCell(c.header, removeLineBreaks),
      ).join(',');
      const body = rows
        .map((r) =>
          CSV_COLUMNS.map((c) => csvCell(c.get(r), removeLineBreaks)).join(','),
        )
        .join('\r\n');
      const csv = `${header}\r\n${body}`;

      const stamp = new Date().toISOString().slice(0, 10);
      triggerDownload(csv, `voyage-contributions-${stamp}.csv`);
      hide();
      message.success(`Downloaded ${rows.length} contributions.`);
    } catch (error) {
      hide();
      message.error('Failed to prepare the download.');
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  }, [statuses, dataset, removeLineBreaks]);

  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <ListEditorialPlatForm />
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 560,
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 3,
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            p: 4,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontSize: '28px',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Downloads
          </Typography>

          <Space direction="vertical" size={10} style={{ display: 'flex' }}>
            {STATUS_OPTIONS.map((o) => (
              <Checkbox
                key={o.value}
                checked={statuses.includes(o.value)}
                onChange={(e) => toggle(o.value, e.target.checked)}
              >
                {o.label}
              </Checkbox>
            ))}

            <Space style={{ marginTop: 4 }}>
              <span>Voyage dataset:</span>
              <Select
                value={dataset}
                onChange={setDataset}
                style={{ width: 200 }}
                options={[
                  { value: 'both', label: 'Both' },
                  { value: '0', label: 'Trans-Atlantic' },
                  { value: '1', label: 'Intra-American' },
                ]}
              />
            </Space>
          </Space>

          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" onClick={selectAll}>
                Select all
              </Button>
              <Button onClick={clear}>Clear</Button>
            </Space>
          </div>

          <Typography
            variant="h5"
            sx={{ mt: 4, mb: 2, fontSize: '22px', fontWeight: 700 }}
          >
            Compatibility options
          </Typography>
          <Checkbox
            checked={removeLineBreaks}
            onChange={(e) => setRemoveLineBreaks(e.target.checked)}
          >
            Remove line breaks from CSV cells
          </Checkbox>

          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              size="large"
              loading={downloading}
              disabled={!canDownload}
              onClick={handleDownload}
            >
              Download
            </Button>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default DownloadVoyages;
