import React, { useRef } from 'react';

import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

import {
  PendingContribution,
  VoyageSection,
} from '../../mockData/pendingContributions';

// ── Voyage comparison table (mirrors legacy editor page) ────────────────────
const VoyageComparisonTable: React.FC<{
  contrib: PendingContribution;
  sections: VoyageSection[];
  summaryDate?: Date | number | string;
}> = ({ contrib, sections, summaryDate }) => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);

  const displayDate = summaryDate
    ? new Date(summaryDate).toString()
    : contrib.changeSet?.timestamp
      ? new Date(contrib.changeSet.timestamp).toString()
      : null;

  const handlePrint = () => {
    const content = tableRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voyage #${contrib.voyage_id} — Comparison</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
            body { font-family: sans-serif; font-size: 12px; margin: 0; color: #333; }
            h2   { margin: 0 0 4px; font-size: 15px; }
            .meta { font-size: 11px; color: #6b7280; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            thead tr { background: #555 !important; color: #fff; }
            th { padding: 7px 10px; text-align: left; font-weight: 600; font-size: 11px; width: 25%; }
            td { padding: 5px 10px; vertical-align: top; }
            .changed { background: #fffde7 !important; font-weight: 600; color: #b45309; }
            button { display: none; }
          </style>
        </head>
        <body>
          <h2>Voyage #${contrib.voyage_id} — Comparison Summary</h2>
          ${displayDate ? `<div class="meta">Summary date: ${displayDate}</div>` : ''}
          ${content.innerHTML}
          <script>
            window.onload = function() {
              window.addEventListener('afterprint', function() { window.close(); });
              window.print();
            };
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div>
      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid #e5e7eb',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/contribute/editor_main/requests')}
          >
            Return to requests list
          </Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        </Space>

        {displayDate && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Summary date: {displayDate}
          </span>
        )}
      </div>

      {/* ── Comparison table ────────────────────────────────────────────── */}
      <div ref={tableRef} style={{ fontSize: 13, overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr style={{ background: '#555', color: '#fff' }}>
              {[
                `Variable`,
                `Voyage #${contrib.voyage_id}`,
                'Contributed value',
                'Editor',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '7px 10px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 12,
                    width: '25%',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <React.Fragment key={section.title}>
                {/* Section header row */}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '10px 10px 4px',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#333',
                      borderTop: '2px solid #ddd',
                      background: '#fff',
                    }}
                  >
                    {section.title}
                  </td>
                </tr>

                {/* Field rows */}
                {section.fields.map((f, idx) => {
                  const changed = f.original !== f.contributed;
                  return (
                    <tr
                      key={f.variable}
                      style={{
                        background: idx % 2 === 0 ? '#f5f5f5' : '#fff',
                      }}
                    >
                      <td
                        style={{
                          padding: '5px 10px',
                          color: '#444',
                          verticalAlign: 'top',
                        }}
                      >
                        {f.variable}:
                      </td>
                      <td
                        style={{
                          padding: '5px 10px',
                          verticalAlign: 'top',
                          color: '#555',
                        }}
                      >
                        {f.original || '—'}
                      </td>
                      <td
                        style={{
                          padding: '5px 10px',
                          verticalAlign: 'top',
                          background: changed ? '#fffde7' : undefined,
                          fontWeight: changed ? 600 : 400,
                          color: changed ? '#b45309' : '#555',
                        }}
                      >
                        {f.contributed || '—'}
                      </td>
                      <td
                        style={{
                          padding: '5px 10px',
                          verticalAlign: 'top',
                          color: '#555',
                        }}
                      >
                        {f.editor || '—'}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VoyageComparisonTable;
