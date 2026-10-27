import { describe, expect, test } from 'vitest';

import { extractTestVarNamesFlatFiles } from '@/utils/functions/extractVarNamesTest';

type MenuNode = {
  var_name?: string;
  label?: { en?: string };
  children?: MenuNode[];
};
type ChartVariable = {
  var_name: string;
  label: { en: string };
  agg_fn?: string;
};

export const unsupportedVariables = (names: string[], fields: string[]) =>
  names.filter((name) => !fields.includes(name));

// Voyage grouping accepts positive integer bins on an existing numeric field.
export const chartField = (name: string) =>
  name.replace(/__bins__[1-9][0-9]*$/, '');

export function testFilterMenu(
  name: string,
  menu: MenuNode[],
  fields: string[],
) {
  describe(name, () => {
    test('every filter names a supported API field', async () => {
      const names = await extractTestVarNamesFlatFiles(menu);
      expect(names.length).toBeGreaterThan(0);
      expect(unsupportedVariables(names, fields)).toEqual([]);
    });

    test('every visible node has a label and each group contains filters', () => {
      const visit = (nodes: MenuNode[]) => {
        expect(nodes.length).toBeGreaterThan(0);
        for (const node of nodes) {
          expect(node.label?.en?.trim()).toBeTruthy();
          if (node.children) visit(node.children);
          else expect(node.var_name?.trim()).toBeTruthy();
        }
      };
      visit(menu);
    });
  });
}

export function testChartOptions(
  name: string,
  options: { x_vars: ChartVariable[]; y_vars: ChartVariable[] },
  fields: string[],
) {
  describe(name, () => {
    test('both axes name supported API fields, including grouping modifiers', () => {
      for (const axis of [options.x_vars, options.y_vars]) {
        expect(axis.length).toBeGreaterThan(0);
        const names = axis.map((item) => item.var_name);
        expect(unsupportedVariables(names.map(chartField), fields)).toEqual([]);
        const series = axis.map(
          (item) => `${item.var_name}:${item.agg_fn ?? ''}`,
        );
        expect(new Set(series).size).toBe(series.length);
      }
    });

    test('variables have labels and supported aggregation functions', () => {
      for (const item of [...options.x_vars, ...options.y_vars]) {
        expect(item.label.en.trim()).not.toBe('');
        if (item.agg_fn)
          expect(['count', 'sum', 'mean']).toContain(item.agg_fn);
      }
    });
  });
}
