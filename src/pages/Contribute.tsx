import MetaTag from '@/components/MetaTag/MetaTag';
import ContributeComponent from '@/components/PresentationComponents/Contribute/Contribute';
import { applySchemaPatches } from '@/utils/contribute/schemaPatches';

const ContributePage: React.FC = () => {
  applySchemaPatches();
  return (
    <div>
      <MetaTag
        pageTitle="Contribute - Slave Voyages"
        pageDescription="Contribute to the Slave Voyages database."
      />
      <ContributeComponent />;
    </div>
  );
};
export default ContributePage;
