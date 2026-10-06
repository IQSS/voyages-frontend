import React from 'react';
import '@/style/landing.scss';
import ENSLAVERS from '@/assets/enslaver_enslaved_LOC_02.jpg';
import ButtonLearnMore from '@/components/SelectorComponents/ButtonComponents/ButtonLearnMore';
import { ENSALVERSPAGE, TRANSATLANTICENSLAVERS } from '@/share/CONST_DATA';
import { translationHomepage } from '@/utils/functions/translationLanguages';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Link } from 'react-router-dom';
const EnslaversBlogs: React.FC = () => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages
  );
  const translatedHomepage = translationHomepage(languageValue);
  return (
    <div className="container-enslavers">
      <div className="enslavers-content">
        <Link
          to="https://www.loc.gov/pictures/item/2014647512/"
          className="enslavers-content-bg"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={ENSLAVERS} alt="Slave Traders" className="register-img" />
        </Link>
        <div className="enslavers-content-detail">
          <h1>{translatedHomepage.homeEnslavers}</h1>
          <p>{translatedHomepage.homeEnslaversDes}</p>
          <ButtonLearnMore
            path={`${ENSALVERSPAGE}${TRANSATLANTICENSLAVERS}#people`}
          />
        </div>
      </div>
    </div>
  );
};

export default EnslaversBlogs;
