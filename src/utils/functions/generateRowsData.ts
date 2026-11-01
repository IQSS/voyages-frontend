/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableAndCardCollectionsOptions } from './TableAndCardCollectionsOptions';
import { traverseData } from './traverseData';

export const generateRowsData = (
  dataRow: Record<string, any>[],
  file?: string,
): Record<string, any>[] => {
  const finalRowArr: Record<string, any>[] = [];
  const columns = TableAndCardCollectionsOptions(file);
  const varNames = columns.var_name;

  if (varNames) {
    dataRow.forEach((data) => {
      const finalRowObj: Record<string, any> = {};

      varNames.forEach((varName: string) => {
        const varArray = varName.split('__');
        const output = traverseData(data, varArray);

        finalRowObj[varName] = flattenData(output);
      });
      if ('connections_count' in data) {
        finalRowObj.connections_count = data.connections_count;
      }
      finalRowArr.push(finalRowObj);
    });
  }
  return finalRowArr;
};

const flattenData = (data: any): any => {
  return Array.isArray(data) ? data.flat(3) : (data ?? null);
};
