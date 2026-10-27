import React, { CSSProperties, useContext } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import NETWORKICON from '@/assets/networksIcon.png';
import { usePageRouter } from '@/hooks/usePageRouter';
import { openCardTarget } from '@/redux/getCardFlatObjectSlice';
import {
  setNetWorksID,
  setNetWorksKEY,
  setsetOpenModalNetworks,
} from '@/redux/getPastNetworksGraphDataSlice';
import '@/style/table.scss';
import {
  ENSLAVEDNODE,
  ENSLAVERSNODE,
  VOYAGESNODECLASS,
  urlRegex,
} from '@/share/CONST_DATA';
import {
  checkPagesRouteForEnslaved,
  checkPagesRouteForEnslavers,
  checkPagesRouteForVoyages,
} from '@/utils/functions/checkPagesRoute';
import { cleanUpTextDisplay } from '@/utils/functions/cleanUpTextDisplay';
import {
  CardTarget,
  normalizeCardTargetId,
  resolveCardTarget,
} from '@/utils/functions/cardTarget';
import {
  DocumentViewerContext,
  createDocKey,
} from '@/utils/functions/documentWorkspace';
import { numberWithCommas } from '@/utils/functions/numberWithCommas';

import PopoverWrapper from '../Cards/PopoverWrapper';

const LINKED_VOYAGES_COLUMN = 'linked_voyages';

export const GenerateCellTableRenderer = (
  params: ICellRendererParams,
  cellFN: string,
  colID: string,
  numberFormat?: string | null,
  nodeClass?: string,
) => {
  const values = params.value;
  const ID = params.data.id;
  const dispatch = useDispatch();
  const { styleName } = usePageRouter();
  const { setDoc } = useContext(DocumentViewerContext);

  let nodeType: string = '';

  if (checkPagesRouteForVoyages(styleName!)) {
    nodeType = VOYAGESNODECLASS;
  } else if (checkPagesRouteForEnslaved(styleName!)) {
    nodeType = ENSLAVEDNODE;
  } else if (checkPagesRouteForEnslavers(styleName!)) {
    nodeType = ENSLAVERSNODE;
  }

  const activateCardTarget = (target: CardTarget) => {
    dispatch(openCardTarget(target));
  };

  const handleCardTargetKeyDown = (
    event: React.KeyboardEvent,
    target: CardTarget,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateCardTarget(target);
    }
  };
  const maxRowsToShow = 5; // Maximum rows to show before applying overflow
  const calculateHeight = (rowCount: number) => {
    const rowHeight = 35; // Adjust this value as needed based on your design

    const maxHeight = rowHeight * maxRowsToShow;
    return rowCount * rowHeight <= maxHeight ? rowCount * rowHeight : maxHeight;
  };
  if (Array.isArray(values)) {
    const rowCount = values.length;
    const calculatedHeight = calculateHeight(rowCount);

    const style: CSSProperties = {
      backgroundColor: '#e5e5e5',
      borderRadius: '8px',
      padding: '0px 10px',
      height: 'auto',
      whiteSpace: 'normal',
      overflow: 'hidden',
      margin: '5px 0',
      textAlign: 'left',
      lineHeight: '1.5',
      fontSize: '.80rem',
      cursor: 'pointer',
    };

    const sourceIcon = (
      value?: string,
      title?: string, // This function renders the source icon depending on if it has a published manifest or not, and if it has a valid URL in the bib
    ) => (
      <>
        <span>{value} </span>
        <i className="fa fa-file-text" aria-hidden="true" title={title}></i>
      </>
    );

    if (values.length <= 0) {
      return (
        <span>
          <div style={{ textAlign: 'left' }}>--</div>
        </span>
      );
    } else {
      const renderedValues = values.map((value: string, index: number) => {
        const cardTarget = resolveCardTarget({
          clickedValue: value,
          rowId: ID,
          explicitNodeClass: nodeClass,
          pageNodeClass: nodeType,
        });
        const additionalProps: React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLDivElement>,
          HTMLDivElement
        > & {
          'data-card-column'?: string;
          'data-card-target-id'?: number;
          'data-card-target-class'?: string;
        } = {
          style: { ...style, cursor: cardTarget ? 'pointer' : 'default' },
          dangerouslySetInnerHTML: { __html: value ?? null },
        };
        if (cardTarget && colID === LINKED_VOYAGES_COLUMN) {
          additionalProps.style = {
            ...additionalProps.style,
            borderColor: 'blue',
            borderWidth: 1,
            borderStyle: 'solid',
          };
        }
        if (cardTarget) {
          additionalProps.role = 'button';
          additionalProps.tabIndex = 0;
          additionalProps['data-card-column'] = colID;
          additionalProps['data-card-target-id'] = cardTarget.id;
          additionalProps['data-card-target-class'] = cardTarget.nodeClass;
          additionalProps['aria-label'] =
            `Open ${cardTarget.nodeClass} ${cardTarget.id} details`;
          additionalProps.onClick = () => activateCardTarget(cardTarget);
          additionalProps.onKeyDown = (event) =>
            handleCardTargetKeyDown(event, cardTarget);
        }
        let extraElements: React.ReactNode = null;
        if (
          (colID === 'voyage_sources' || colID === 'enslaved_sources') &&
          params.data.sources__zotero_group_id &&
          params.data.sources__title &&
          params.data.sources__zotero_item_id &&
          params.data.sources__has_published_manifest &&
          params.data.sources__has_published_manifest[index]
        ) {
          additionalProps.style = {
            ...style,
            borderColor: 'blue',
            borderWidth: 1,
            borderStyle: 'solid',
          };
          additionalProps.dangerouslySetInnerHTML = undefined;
          extraElements = sourceIcon(value, 'View Source Document');

          delete additionalProps['data-card-column'];
          delete additionalProps['data-card-target-id'];
          delete additionalProps['data-card-target-class'];
          additionalProps['aria-label'] = 'View Source Document';

          additionalProps.onClick = (e) => {
            e.stopPropagation();
            setDoc({
              key: createDocKey(
                params.data.sources__zotero_group_id[index],
                params.data.sources__zotero_item_id[index],
              ),
              label: params.data.sources__title[index],
              thumb: params.data.sources__thumbnail?.at(index),
              revision_number: 1,
              textSnippet: '',
            });
          };
          additionalProps.onKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDoc({
                key: createDocKey(
                  params.data.sources__zotero_group_id[index],
                  params.data.sources__zotero_item_id[index],
                ),
                label: params.data.sources__title[index],
                thumb: params.data.sources__thumbnail?.at(index),
                revision_number: 1,
                textSnippet: '',
              });
            }
          };
        }
        // Check if the source string contains a URL and if the manifest is published, then make the cell clickable to open the URL in a new tab.
        const sourceString = params.data.sources__bib?.[index];
        const foundUrl = sourceString?.match(urlRegex) ?? null;
        if (
          (colID === 'voyage_sources' || colID === 'enslaved_sources') &&
          params.data.sources__title?.[index] &&
          params.data.sources__has_published_manifest?.[index] === false &&
          foundUrl?.[0]
        ) {
          // Only display external source if the manifest is not published even if it has a link inside the bib
          const urlString = foundUrl[0];
          try {
            new URL(urlString); // Throws if invalid

            additionalProps.style = {
              ...style,
              borderColor: 'red',
              borderWidth: 1,
              borderStyle: 'solid',
            };
            additionalProps.dangerouslySetInnerHTML = undefined;
            extraElements = sourceIcon(value, 'View External Source');

            delete additionalProps['data-card-column'];
            delete additionalProps['data-card-target-id'];
            delete additionalProps['data-card-target-class'];
            additionalProps['aria-label'] = 'View External Source';

            additionalProps.onClick = (e) => {
              e.stopPropagation();
              window.open(urlString, '_blank', 'noopener,noreferrer');
            };
            additionalProps.onKeyDown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.open(urlString, '_blank', 'noopener,noreferrer');
              }
            };
          } catch (e) {
            console.error('Invalid URL:', urlString);
          }
        }

        let cellComponent = (
          <span key={`${index}-${value}`}>
            <div {...additionalProps} key={`${index}-${value}`}>
              {extraElements}
            </div>
          </span>
        );
        if (
          (colID === 'voyage_sources' || colID === 'enslaved_sources') &&
          params.data.sources__bib
        ) {
          // Wrap the component so that we can display a tooltip.
          cellComponent = (
            <PopoverWrapper
              padding={2}
              key={`${index}-${value}`}
              popoverContents={
                <div
                  dangerouslySetInnerHTML={{
                    __html: params.data.sources__bib[index],
                  }}
                  key={`${index}-${value}`}
                />
              }
            >
              {cellComponent}
            </PopoverWrapper>
          );
        }
        return cellComponent;
      });
      const ellipsisStyle: CSSProperties = {
        ...style,
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        overflow: 'hidden',
      };

      const remainingRows = values.slice(maxRowsToShow);
      const renderRows = renderedValues.slice(0, maxRowsToShow);
      return (
        <div
          style={{ maxHeight: calculatedHeight, overflowY: 'auto' }}
          key={`${uuidv4()}`}
        >
          {renderRows}
          {remainingRows.length > 0 &&
            remainingRows.map((value, index) => (
              <div key={`${index}-${value}`} style={ellipsisStyle}>
                {cleanUpTextDisplay(value)}
              </div>
            ))}
        </div>
      );
    }
  } else if (typeof values !== 'object' && cellFN !== 'networks') {
    const values = params.value;
    const cardTarget = resolveCardTarget({
      clickedValue: values,
      rowId: ID,
      explicitNodeClass: nodeClass,
      pageNodeClass: nodeType,
    });
    let justifyContent: CSSProperties['justifyContent'] = 'flex-end';
    if (typeof values === 'number') {
      justifyContent = 'flex-end';
    } else if (
      (values === '--' && numberFormat === 'comma') ||
      (values === '--' && numberFormat === 'percent')
    ) {
      justifyContent = 'flex-end';
    } else {
      justifyContent = 'flex-start';
    }

    let valueFormat = values;
    if (numberFormat === 'comma') {
      valueFormat = numberWithCommas(values);
    } else if (numberFormat === 'percent') {
      const percent = values * 100;
      valueFormat = values === '--' ? '0.0%' : `${percent.toFixed(1)}%`;
    }

    return (
      <div className="div-value">
        <div
          className="value-cell"
          style={{
            justifyContent: justifyContent,
            cursor: cardTarget ? 'pointer' : 'default',
          }}
          role={cardTarget ? 'button' : undefined}
          tabIndex={cardTarget ? 0 : undefined}
          data-card-column={cardTarget ? colID : undefined}
          data-card-target-id={cardTarget?.id}
          data-card-target-class={cardTarget?.nodeClass}
          aria-label={
            cardTarget
              ? `Open ${cardTarget.nodeClass} ${cardTarget.id} details`
              : undefined
          }
          onClick={
            cardTarget ? () => activateCardTarget(cardTarget) : undefined
          }
          onKeyDown={
            cardTarget
              ? (event) => handleCardTargetKeyDown(event, cardTarget)
              : undefined
          }
        >
          {valueFormat}
        </div>
      </div>
    );
  } else if (cellFN === 'networks' && nodeClass) {
    const networkId = normalizeCardTargetId(ID);
    const networkKey = nodeType || nodeClass;
    const openNetwork = () => {
      if (networkId === null) return;
      dispatch(setsetOpenModalNetworks(true));
      dispatch(setNetWorksID(networkId));
      dispatch(setNetWorksKEY(networkKey));
    };
    return (
      <span
        role={networkId !== null ? 'button' : undefined}
        className="network-icon"
        tabIndex={networkId !== null ? 0 : undefined}
        aria-label={
          networkId !== null ? `Open connections for ${networkId}` : undefined
        }
        onClick={networkId !== null ? openNetwork : undefined}
        onKeyDown={(e) => {
          if (networkId !== null && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openNetwork();
          }
        }}
      >
        <img
          alt="network"
          src={NETWORKICON}
          style={{ cursor: networkId !== null ? 'pointer' : 'default' }}
        />
      </span>
    );
  } else {
    return (
      <div className="div-value">
        <div className="value">--</div>
      </div>
    );
  }
};
