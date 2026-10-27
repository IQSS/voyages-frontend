/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';

import '@/style/estimates.scss';
import './EnslaverContributionReview.scss';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import {
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';
import {
  Button,
  Descriptions,
  Empty,
  message,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchContributionByIdForEditor } from '@/fetch/contributeFetch/fetchContributionsData';
import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';

import { statusConfig } from '../../commons/StatusCellRenderer';
import { transformContributionData } from '../../utils/transformContributionData';

const { Text, Title } = Typography;

const listPathFor = (schema?: string): string =>
  schema === 'Enslaved'
    ? '/contribute/editor_main/enslaved_contrib'
    : '/contribute/editor_main/enslavers_contrib';

// ── changeSet readers ────────────────────────────────────────────────────────
// The root entity's changes live at changeSet.changes[0].changes. Fields are
// matched by the tail of their property uid (e.g. "Enslaver_birth_year" ends
// with "birth_year") so this does not depend on the exact schema prefix.
const rootChanges = (c?: Contribution): any[] =>
  (c?.changeSet as any)?.changes?.[0]?.changes ?? [];

const nameOf = (v: any): string =>
  v == null
    ? ''
    : typeof v === 'object'
      ? (v.data?.Name ?? v.data?.['Nation name'] ?? v.data?.Alias ?? '')
      : String(v);

const readField = (changes: any[], backingField: string): string => {
  const hit = changes.find(
    (c) =>
      (c?.kind === 'direct' || c?.kind === 'linked') &&
      typeof c?.property === 'string' &&
      c.property.endsWith(backingField),
  );
  if (!hit) return '';
  return hit.kind === 'linked' ? nameOf(hit.changed) : nameOf(hit.changed);
};

const readDate = (changes: any[], prefix: string): string => {
  const y = readField(changes, `${prefix}_year`);
  const m = readField(changes, `${prefix}_month`);
  const d = readField(changes, `${prefix}_day`);
  const parts = [y, m, d].filter((p) => p !== '' && p !== '0');
  return parts.length ? parts.join('-') : '';
};

const readAliases = (changes: any[], principal: string): string[] => {
  const list = changes.find(
    (c) =>
      c?.kind === 'ownedList' && String(c?.property ?? '').endsWith('Aliases'),
  );
  const fromList: string[] = (list?.modified ?? [])
    .map((m: any) => m?.ownedEntity?.data?.Alias)
    .filter(Boolean);
  const all = [principal, ...fromList].filter(Boolean);
  return Array.from(new Set(all));
};

const dash = (v: string) => (v && v.trim() !== '' ? v : '—');

const EnslaverContributionReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [active, setActive] = useState<Contribution | undefined>(undefined);
  const [status, setStatus] = useState<ContributionStatus | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const backToList = useCallback(
    () => navigate(listPathFor(active?.root?.schema)),
    [navigate, active?.root?.schema],
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await fetchContributionByIdForEditor(id);
        if (cancelled) return;
        const contribution = transformContributionData(data);
        setActive(contribution);
        setStatus(contribution.status);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const model = useMemo(() => {
    const changes = rootChanges(active);
    const principal = readField(changes, 'principal_alias');
    return {
      principal,
      aliases: readAliases(changes, principal),
      birth: readDate(changes, 'birth'),
      birthPlace: readField(changes, 'birth_place_id'),
      death: readDate(changes, 'death'),
      deathPlace: readField(changes, 'death_place_id'),
      fatherName: readField(changes, 'father_name'),
      fatherOccupation: readField(changes, 'father_occupation'),
      motherName: readField(changes, 'mother_name'),
      probateDate: readField(changes, 'probate_date'),
      willPounds: readField(changes, 'will_value_pounds'),
      willDollars: readField(changes, 'will_value_dollars'),
      willCourt: readField(changes, 'will_court'),
      principalLocation: readField(changes, 'principal_location_id'),
      bioNotes: readField(changes, 'notes'),
    };
  }, [active]);

  const decide = useCallback(
    async (next: ContributionStatus) => {
      if (!id) return;
      try {
        await updateContributionStatus(id, next);
        message.success(
          next === ContributionStatus.Accepted
            ? 'Contribution accepted.'
            : 'Contribution rejected.',
        );
        backToList();
      } catch (error) {
        message.error('Failed to update contribution status');
        console.error('Status update error:', error);
      }
    },
    [id, backToList],
  );

  if (loading) {
    return (
      <Box style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </Box>
    );
  }

  if (notFound || !active) {
    return (
      <Box style={{ padding: 24 }}>
        <div
          style={{
            color: '#721c24',
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: 4,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Contribution &ldquo;{id}&rdquo; not found.</span>
          <Button size="small" onClick={() => navigate(listPathFor())}>
            Back to list
          </Button>
        </div>
      </Box>
    );
  }

  const author = active.changeSet?.author || '—';
  const ts = active.changeSet?.timestamp;
  const contributorNotes = active.changeSet?.comments || '';

  // ── Tab content ─────────────────────────────────────────────────────────
  const aliasesTab = (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" disabled>
          New Alias
        </Button>
        <Button disabled>Set as Principal</Button>
        <Button danger disabled>
          Delete Alias
        </Button>
      </Space>
      <div
        style={{
          border: '1px solid #e8e8e8',
          borderRadius: 6,
          padding: 16,
          minHeight: 120,
        }}
      >
        {model.aliases.length ? (
          model.aliases.map((a, i) => (
            <div key={i} style={{ padding: '6px 0', fontWeight: 600 }}>
              {a}
              {a === model.principal && (
                <Tag color="green" style={{ marginLeft: 8 }}>
                  Principal
                </Tag>
              )}
            </div>
          ))
        ) : (
          <Empty description="No aliases" />
        )}
      </div>

      {/* Voyages — kept for parity with legacy, but not wired yet */}
      <div style={{ marginTop: 20 }}>
        <Text type="secondary">Voyages</Text>
        <div style={{ marginTop: 8 }}>
          <Space>
            <Tooltip title="Not available yet">
              <Button disabled>Link Voyage</Button>
            </Tooltip>
            <Tooltip title="Not available yet">
              <Button disabled>Delink</Button>
            </Tooltip>
          </Space>
        </div>
        <div style={{ marginTop: 8, color: '#9ca3af' }}>
          Voyage linking is not available in this view yet.
        </div>
      </div>
    </div>
  );

  const personalTab = (
    <Descriptions bordered column={1} size="small">
      <Descriptions.Item label="Principal alias">
        {dash(model.principal)}
      </Descriptions.Item>
      <Descriptions.Item label="Birth">{dash(model.birth)}</Descriptions.Item>
      <Descriptions.Item label="Birth place">
        {dash(model.birthPlace)}
      </Descriptions.Item>
      <Descriptions.Item label="Death">{dash(model.death)}</Descriptions.Item>
      <Descriptions.Item label="Death place">
        {dash(model.deathPlace)}
      </Descriptions.Item>
      <Descriptions.Item label="Father name">
        {dash(model.fatherName)}
      </Descriptions.Item>
      <Descriptions.Item label="Father occupation">
        {dash(model.fatherOccupation)}
      </Descriptions.Item>
      <Descriptions.Item label="Mother name">
        {dash(model.motherName)}
      </Descriptions.Item>
      <Descriptions.Item label="Probate date">
        {dash(model.probateDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Will value (pounds)">
        {dash(model.willPounds)}
      </Descriptions.Item>
      <Descriptions.Item label="Will value (dollars)">
        {dash(model.willDollars)}
      </Descriptions.Item>
      <Descriptions.Item label="Will court">
        {dash(model.willCourt)}
      </Descriptions.Item>
      <Descriptions.Item label="Principal location">
        {dash(model.principalLocation)}
      </Descriptions.Item>
      <Descriptions.Item label="Notes">
        {dash(model.bioNotes)}
      </Descriptions.Item>
    </Descriptions>
  );

  const notesTab = (
    <div style={{ whiteSpace: 'pre-wrap', minHeight: 80 }}>
      {contributorNotes ? (
        contributorNotes
      ) : (
        <Empty description="No notes from contributor" />
      )}
    </div>
  );

  const reviewTab = (
    <div>
      <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Contributor">{author}</Descriptions.Item>
        <Descriptions.Item label="Date">
          {ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag
            color={
              status !== undefined ? statusConfig[status]?.color : 'default'
            }
          >
            {status !== undefined ? statusConfig[status]?.label : '—'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
      {status === ContributionStatus.Submitted ? (
        <Space>
          <Button
            type="primary"
            onClick={() => decide(ContributionStatus.Accepted)}
          >
            Accept
          </Button>
          <Button danger onClick={() => decide(ContributionStatus.Rejected)}>
            Reject
          </Button>
        </Space>
      ) : (
        <Text type="secondary">
          This contribution is not awaiting review, so it cannot be decided
          here.
        </Text>
      )}
    </div>
  );

  const tabItems = [
    { key: 'aliases', label: 'Aliases and Voyages', children: aliasesTab },
    { key: 'personal', label: 'Personal information', children: personalTab },
    // Not backed by the schema yet — clickable, but shows an empty state.
    {
      key: 'sources',
      label: 'Biographical Sources',
      children: (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No biographical sources"
          style={{ padding: '40px 0' }}
        />
      ),
    },
    { key: 'notes', label: 'Notes from contributor', children: notesTab },
    { key: 'review', label: 'Review and Submit', children: reviewTab },
  ];

  return (
    <Box
      className="enslaver-review"
      sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '12px 0',
        }}
      >
        <button
          onClick={backToList}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            border: '1px solid #dee2e6',
            borderRadius: 3,
            background: '#fff',
            cursor: 'pointer',
            color: '#495057',
          }}
          title="Back to list"
        >
          <ArrowLeftOutlined />
        </button>
        <Title level={4} style={{ margin: 0 }}>
          {dash(model.principal)}
        </Title>
      </div>

      <Tabs defaultActiveKey="aliases" items={tabItems} />
    </Box>
  );
};

export default EnslaverContributionReview;
