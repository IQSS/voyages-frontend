import React, { useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Download } from 'lucide-react';
import { useSelector } from 'react-redux';

import { usePageRouter } from '@/hooks/usePageRouter';
import { RootState } from '@/redux/store';
import { ColumnDef } from '@/share/InterfaceTypesTable';
import {
  getColorBTNVoyageDatasetBackground,
  getColorBoxShadow,
  getColorHoverBackground,
} from '@/utils/functions/getColorStyle';
import { translationHomepage } from '@/utils/functions/translationLanguages';

interface TableDownloadButtonsProps {
  data: Record<string, any>[];
  columnDefs: ColumnDef[];
  filename?: string;
}

const TableDownloadButtons: React.FC<TableDownloadButtonsProps> = ({
  data,
  columnDefs,
  filename = 'table-data',
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [downloadOption, setDownloadOption] = useState<'all' | 'filtered'>(
    'all',
  );
  const { styleName: styleNameRoute } = usePageRouter();

  const handleOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleDownloadOptionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDownloadOption(event.target.value as 'all' | 'filtered');
  };

  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedHomepage = translationHomepage(languageValue);

  const downloadCSV = () => {
    const isFiltered = downloadOption === 'filtered';
    const filteredData = isFiltered
      ? data.filter((row) => {
        const filteredRow: Record<string, any> = {};
        columnDefs.forEach((col) => {
          if (!col.hide) {
            filteredRow[col.field] = row[col.field];
          }
        });
        return filteredRow;
      })
      : data;
    const csvContent = [
      isFiltered
        ? columnDefs
          .filter((col) => col.field !== 'connections' && !col.hide)
          .map((col) => col.headerName)
          .join(',')
        : columnDefs
          .filter((col) => col.field !== 'connections')
          .map((col) => col.headerName)
          .join(','),
      ...filteredData.map((row) =>
        isFiltered
          ? columnDefs
            .filter((col) => col.field !== 'connections' && !col.hide)
            .map((col) => JSON.stringify(row[col.field] ?? ''))
            .join(',')
          : columnDefs
            .filter((col) => col.field !== 'connections')
            .map((col) => JSON.stringify(row[col.field] ?? ''))
            .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${downloadOption}-${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleDialogClose();
  };

  const downloadExcel = () => {
    const isFiltered = downloadOption === 'filtered';
    const filteredData = isFiltered
      ? data.filter((row) => {
        const filteredRow: Record<string, any> = {};
        columnDefs.forEach((col) => {
          if (!col.hide) {
            filteredRow[col.field] = row[col.field];
          }
        });
        return filteredRow;
      })
      : data;

    const excelContent = [
      isFiltered
        ? columnDefs
          .filter((col) => col.field !== 'connections' && !col.hide)
          .map((col) => col.headerName)
          .join('\t')
        : columnDefs
          .filter((col) => col.field !== 'connections')
          .map((col) => col.headerName)
          .join('\t'),
      ...filteredData.map((row) =>
        isFiltered
          ? columnDefs
            .filter((col) => col.field !== 'connections' && !col.hide)
            .map((col) => JSON.stringify(row[col.field] ?? ''))
            .join('\t')
          : columnDefs
            .filter((col) => col.field !== 'connections')
            .map((col) => JSON.stringify(row[col.field] ?? ''))
            .join('\t'),
      ),
    ].join('\n');

    const blob = new Blob([excelContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${downloadOption}-${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleDialogClose();
  };

  return (
    <div>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          onClick={handleOpen}
          endIcon={<Download size={14} />}
          sx={{
            fontSize: '0.80rem',
            textTransform: 'unset',
            backgroundColor: getColorBTNVoyageDatasetBackground(
              styleNameRoute!,
            ),
            boxShadow: getColorBoxShadow(styleNameRoute!),
            fontWeight: 600,
            color: '#ffffff',
            width: { xs: 120, sm: 120 },
            height: 28,
            '&:hover': {
              backgroundColor: getColorHoverBackground(styleNameRoute!),
            },
          }}
        >
          {translatedHomepage.downloanBTN}
        </Button>
      </span>
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle sx={{ fontSize: 16 }}>
          {translatedHomepage.selectingOption}
        </DialogTitle>
        <DialogContent>
          <RadioGroup
            value={downloadOption}
            onChange={handleDownloadOptionChange}
          >
            <FormControlLabel
              value="all"
              control={<Radio />}
              label={
                <span style={{ fontSize: '0.90rem' }}>
                  {translatedHomepage.downloadAll}
                </span>
              }
            />
            <FormControlLabel
              value="filtered"
              control={<Radio />}
              label={
                <span style={{ fontSize: '0.90rem' }}>
                  {translatedHomepage.downloadFilter}{' '}
                </span>
              }
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <div>
            <Button
              onClick={handleDialogClose}
              sx={{
                fontSize: '0.80rem',
                textTransform: 'unset',
                backgroundColor: '#494949',
                fontWeight: 600,
                color: '#ffffff',
                width: { xs: 80, sm: 80 },
                height: 28,
                '&:hover': {
                  backgroundColor: '#333333',
                },
              }}
            >
              {translatedHomepage.downloadCancel}
            </Button>
          </div>
          <div>
            <Button
              onClick={downloadCSV}
              endIcon={<Download size={14} />}
              style={{ marginRight: 4 }}
              sx={{
                fontSize: '0.80rem',
                textTransform: 'unset',
                backgroundColor: getColorBTNVoyageDatasetBackground(
                  styleNameRoute!,
                ),
                boxShadow: getColorBoxShadow(styleNameRoute!),
                fontWeight: 600,
                color: '#ffffff',
                width: { xs: 80, sm: 80 },
                height: 28,
                '&:hover': {
                  backgroundColor: getColorHoverBackground(styleNameRoute!),
                },
              }}
            >
              CSV
            </Button>
            <Button
              onClick={downloadExcel}
              endIcon={<Download size={14} />}
              sx={{
                fontSize: '0.80rem',
                textTransform: 'unset',
                backgroundColor: getColorBTNVoyageDatasetBackground(
                  styleNameRoute!,
                ),
                boxShadow: getColorBoxShadow(styleNameRoute!),
                fontWeight: 600,
                color: '#ffffff',
                width: { xs: 80, sm: 80 },
                height: 28,
                '&:hover': {
                  backgroundColor: getColorHoverBackground(styleNameRoute!),
                },
              }}
            >
              Excel
            </Button>
          </div>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TableDownloadButtons;
