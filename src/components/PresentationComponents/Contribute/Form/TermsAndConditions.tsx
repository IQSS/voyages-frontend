import { Button } from '@mui/material';
import { useSelector } from 'react-redux';

import { useNavigation } from '@/hooks/useNavigation';
import { RootState } from '@/redux/store';
import '@/style/contributeContent.scss';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

const TermsAndConditions: React.FC = () => {
  const { handleAcceptTeams } = useNavigation();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const t = translationLanguagesContribute(languageValue);

  return (
    <div className="contribute-content">
      <h1 className="page-title-1">{t.contributeTermsAndConditions}</h1>
      <p>{t.contributeTermsAndConditionsText}</p>
      <div>
        <Button
          onClick={handleAcceptTeams}
          type="submit"
          variant="contained"
          color="primary"
          sx={{
            backgroundColor: 'rgb(55, 148, 141)',
            color: '#fff',
            marginRight: '0.5rem',
            height: 32,
            fontSize: '0.85rem',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(6, 186, 171, 0.83)',
            },
          }}
        >
          {t.contributeTermsAndConditionsAccept}
        </Button>
      </div>
    </div>
  );
};
export default TermsAndConditions;
