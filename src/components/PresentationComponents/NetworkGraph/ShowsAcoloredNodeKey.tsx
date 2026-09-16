import { useSelector } from 'react-redux';

import { RootState } from '@/redux/store';
import '@/style/networks.scss';
import { edgeRoleColors, nodeClassColors } from '@/utils/functions/networkPalette';
import { translatedConnection } from '@/utils/functions/translationLanguages';

type ShowsAcoloredNodeKeyProps = {
  edgeRoles?: string[];
  nodeClasses?: string[];
};

const ShowsAcoloredNodeKey = ({
  edgeRoles = [],
  nodeClasses = [],
}: ShowsAcoloredNodeKeyProps) => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translated = translatedConnection(languageValue);
  const roleColors = edgeRoleColors(edgeRoles);

  const nodeKeys = [
    { nodeClass: 'voyages', label: translated.voyages },
    { nodeClass: 'enslavers', label: translated.enslavers },
    { nodeClass: 'enslaved', label: translated.enslavedPeople },
    { nodeClass: 'enslavement_relations', label: translated.connection },
  ];

  const visibleNodeKeys = nodeKeys.filter(({ nodeClass }) =>
    nodeClasses.includes(nodeClass),
  );

  if (visibleNodeKeys.length === 0 && edgeRoles.length === 0) {
    return null;
  }

  return (
    <div className="colored-box">
      <div className="div-box-left">
        {visibleNodeKeys.map(({ nodeClass, label }) => (
          <div className="div-box" key={nodeClass}>
            <div
              className="circle"
              style={{ backgroundColor: nodeClassColors[nodeClass] }}
            ></div>
            <p title={label}>{label}</p>
          </div>
        ))}
      </div>
      {edgeRoles.length > 0 && (
        <div className="div-box-right">
          {edgeRoles.map((role) => (
            <div className="div-box-line" key={role}>
              <div
                className="line-edges"
                style={{ backgroundColor: roleColors[role] }}
              ></div>
              <p title={role}>{role}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ShowsAcoloredNodeKey;
