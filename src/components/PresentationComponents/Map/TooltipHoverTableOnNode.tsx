import { NodeAggroutes } from '@/share/InterfaceTypesMap';
import '@/style/table-popup.scss';
import { nodeTypeOrigin, nodeTypePostDisembarkation } from '@/share/CONST_DATA';
import { Divider } from '@mui/material';

interface TooltipHoverTableOnNodeProps {
  nodesDatas: NodeAggroutes[];
  nodeType: string;
  handleSetClusterKeyValue: (value: string, nodeType: string) => void;
}

export const TooltipHoverTableOnNode = ({
  nodesDatas,
  nodeType,
  handleSetClusterKeyValue,
}: TooltipHoverTableOnNodeProps) => {
  const maxDisplayCount = 4;

  if (!nodesDatas) {
    return <div>No child nodes available.</div>;
  }

  const displayedNodes = nodesDatas!.slice(0, maxDisplayCount);
  const remainingNodes = nodesDatas!.slice(maxDisplayCount);

  const tatalOriginCount = nodesDatas?.reduce(
    (total, node) => total + node.weights.origin!,
    0
  );

  const tatalPostDisembarkationCount = nodesDatas?.reduce(
    (total, node) => total + node.weights.post_disembarkation!,
    0
  );

  const totalTextOrigin = 'other Language Groups';
  const totalTextPostDisembarkation = 'other locations';

  const hederTableOrigin = (
    <tr>
      <td>
        Language Group{' '}
        <span
          id="origins_map_key_pill"
          data-toggle="tooltip"
          className="badge badge-pill badge-secondary tooltip-pointer"
          title=""
          data-original-title="Origins are derived from user contributions."
        >
          (IMP){' '}
        </span>
      </td>
      <td>Number of Liberated Africans with Identified Languages</td>
    </tr>
  );

  const hederTablePostDisembarkation = (
    <tr>
      <td style={{ width: 185 }}>Last Known Location</td>
      <td style={{ width: 115 }}>People</td>
    </tr>
  );

  const hederOtherType = (
    <tr>
      <td>
        Language Group{' '}
        <span
          id="origins_map_key_pill"
          data-toggle="tooltip"
          className="badge badge-pill badge-secondary tooltip-pointer"
          title=""
          data-original-title="Origins are derived from user contributions."
        >
          (IMP){' '}
        </span>
      </td>
      <td>Number of Liberated Africans with Identified Languages</td>
    </tr>
  );

  const textHederOfTableOtherType = (
    <div className="embarkations-type">
      <a href="#" onClick={() => console.log('textHederOfTableOtherType')}>
        1926 Liberated Africans embarked
      </a>{' '}
      in Loango, of whom {tatalPostDisembarkationCount} have been identified as
      belonging to
      <a href="#" onClick={() => console.log('textHederOfTableOtherType')}>
        16 language groups
      </a>
      <Divider style={{ margin: '0.75rem 0', opacity: 0.5 }} />
    </div>
  );

  return (
    <>
      {' '}
      {nodeType !== nodeTypePostDisembarkation &&
        nodeType !== nodeTypeOrigin &&
        textHederOfTableOtherType}
      <table className="lgmaptable">
        <tbody>
          {nodeType === nodeTypeOrigin
            ? hederTableOrigin
            : nodeType === nodeTypePostDisembarkation
              ? hederTablePostDisembarkation
              : hederOtherType}
          {displayedNodes.map((node, index) => (
            <tr key={`${node.id}-${index}`}>
              <td>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSetClusterKeyValue(node.data.name!, nodeType);
                  }}
                >
                  {node.data.name!}
                </a>
              </td>
              <td>
                {' '}
                {nodeType === nodeTypeOrigin
                  ? node.weights.origin!
                  : node.weights.post_disembarkation}
              </td>
            </tr>
          ))}
          {remainingNodes.length > 0 && (
            <tr>
              <td>
                {remainingNodes.length}{' '}
                {` ${nodeType === nodeTypeOrigin
                    ? totalTextOrigin
                    : nodeType === nodeTypePostDisembarkation
                      ? totalTextPostDisembarkation
                      : hederOtherType
                  } `}
              </td>
              <td>
                {remainingNodes.reduce(
                  (total, node) =>
                    total +
                    (nodeType === nodeTypeOrigin
                      ? node.weights.origin!
                      : node.weights.post_disembarkation!),
                  0
                )}
              </td>
            </tr>
          )}
          <tr>
            <td>Total</td>
            <td>
              {nodeType === nodeTypeOrigin
                ? tatalOriginCount
                : tatalPostDisembarkationCount}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
