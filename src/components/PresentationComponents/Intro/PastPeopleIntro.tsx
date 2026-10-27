import '@/style/page-past.scss';
import { Grid, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import PersonImage from '@/assets/peoplepage.png';
import MetaTag from '@/components/MetaTag/MetaTag';
import { setCurrentEnslavedPage } from '@/redux/getScrollEnslavedPageSlice';
import { setCurrentEnslaversPage } from '@/redux/getScrollEnslaversPageSlice';
import { resetAll } from '@/redux/resetAllSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { LabelFilterMeneList } from '@/share/InterfaceTypes';
import PEOPLE from '@/utils/flatfiles/people/people_page_data.json';
import { checkPathPeople } from '@/utils/functions/checkPathPeople';

type LanguageKeys = 'en' | 'es' | 'pt';

const PastPeopleIntro = () => {
  const dispatch: AppDispatch = useDispatch();
  const isLanguageKey = (key: any): key is LanguageKeys => {
    return ['en', 'es', 'pt'].includes(key);
  };
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  if (!isLanguageKey(languageValue)) {
    throw new Error(`Invalid language value: ${languageValue}`);
  }
  const pageTitle = 'People of the African Slave Trade: Homepage';
  const pageDescription =
    'Explore the lives, journeys, and stories of the people affected by the African slave trade through data, archives, and human-centered narratives.';
  return (
    <div>
      <MetaTag pageDescription={pageDescription} pageTitle={pageTitle} />

      <Grid container id="main-page-past-home">
        <Grid item sm={6} md={4} lg={4} className="grid-people-image">
          <Link
            to="https://www.loc.gov/pictures/item/2017659626/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="flipped-image"
              src={PersonImage}
              alt="PersonImage"
            />
          </Link>
        </Grid>
        <Grid item sm={6} md={8} lg={8} className="grid-people-introduction">
          {PEOPLE.map((item, index) => {
            const { text_description, text_introuduce, header } = item;
            const textDescription = (text_description as LabelFilterMeneList)[
              languageValue
            ];
            const textIntrouduce = (text_introuduce as LabelFilterMeneList)[
              languageValue
            ];

            return (
              <div
                key={`${textIntrouduce}-${index}`}
                className="text-intro-box"
              >
                <div className="text-intro">
                  {textIntrouduce}
                  <div style={{ marginTop: 15 }}>{textDescription}</div>
                </div>
                <div className="btn-Enslaved-enslavers">
                  {header.map((title) => {
                    const textHeader = (title.label as LabelFilterMeneList)[
                      languageValue
                    ];
                    const URL = checkPathPeople(textHeader);
                    return (
                      <Button
                        key={textHeader}
                        className="enslaved-btn"
                        sx={{
                          backgroundColor: '#fff',
                          color: '#000',
                          marginRight: '20px',
                          padding: '8px',
                          fontSize: '1.15rem',
                          lineHeight: '28px',
                          width: '150px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textTransform: 'none',
                          fontWeight: 700,
                        }}
                        onClick={() => {
                          dispatch(setCurrentEnslavedPage(1));
                          dispatch(setCurrentEnslaversPage(1));
                          dispatch(resetAll());
                          const keysToRemove = Object.keys(localStorage);
                          keysToRemove.forEach((key) => {
                            localStorage.removeItem(key);
                          });
                          window.location.href = URL;
                        }}
                      >
                        {textHeader}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <Link
            to={PEOPLE[0].credit.hyperlink}
            style={{
              textDecoration: 'none',
              color: '#000',
              fontSize: '0.95rem',
            }}
            className="credit-bottom-right"
          >
            {`${PEOPLE[0].credit.label[languageValue as LanguageKeys]}: ${
              PEOPLE[0].credit.artist_name
            }`}
          </Link>
        </Grid>
      </Grid>
    </div>
  );
};

export default PastPeopleIntro;
