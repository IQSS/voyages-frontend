// Define the correct shape for AntD TreeSelect node
export interface TreeSelectNode {
  title: string;
  value: string | number;
  key: string | number;
  selectable?: boolean;
  children?: TreeSelectNode[];
}

// Input location data type
export interface LocationNode {
  id: number;
  name: string;
  code?: string | number;
  location_type?: {
    name: string;
  };
  children?: LocationNode[];
}

// Main function to convert your nested location data
export function convertToTreeSelectFormat(
  data: LocationNode[],
): TreeSelectNode[] {
  const convertNode = (node: LocationNode): TreeSelectNode => {
    const isPlace = node.location_type?.name === 'Place';

    return {
      title: node.code ? `${node.name} (Code: ${node.code})` : node.name,
      value: String(node.id),
      key: String(node.id),
      selectable: isPlace,
      children:
        node.children && node.children.length > 0
          ? node.children.map(convertNode)
          : undefined,
    };
  };

  return data.map(convertNode);
}
