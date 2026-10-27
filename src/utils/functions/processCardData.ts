import { generateRowsData } from './generateRowsData';
import { generateCardsData } from './generateCardsData';
import { TransatlanticCardProps } from '@/share/InterfaceTypes';
import { normalizeCardNodeClass } from './cardTarget';
import type { CardNodeClass } from './cardTarget';

export interface ProcessedCardTarget {
  nodeClass: CardNodeClass;
  column: string;
}

export interface ProcessedCardChild {
  label: string;
  value: any;
  number_format?: string | number | null;
  cardTarget?: ProcessedCardTarget;
}

export interface ProcessedCardGroup {
  header: string;
  childValue: ProcessedCardChild[];
}

export const processCardData = (
  data: Record<string, any>[],
  cardDataArray: TransatlanticCardProps[],
  fileCardName: string,
  languageValue: string,
): ProcessedCardGroup[] => {
  if (data.length > 0) {
    const finalData = generateRowsData(data, fileCardName);
    // console.log({ finalData, fileCardName })
    const newCardData: ProcessedCardGroup[] = cardDataArray.map((value) => {
      const cardGroup = {
        header: value.label[languageValue],
        childValue: value?.children?.map((child) => {
          const targetField = child.cell_val?.fields.find(
            (field) => field.node_class,
          );
          const targetNodeClass = normalizeCardNodeClass(
            targetField?.node_class,
          );
          return {
            label: child.label[languageValue],
            value: generateCardsData(finalData[0], child),
            number_format: child.number_format,
            ...(targetField && targetNodeClass
              ? {
                  cardTarget: {
                    nodeClass: targetNodeClass,
                    column: targetField.var_name,
                  },
                }
              : {}),
          };
        }),
      };
      return cardGroup;
    });
    return newCardData;
  }
  return [];
};
