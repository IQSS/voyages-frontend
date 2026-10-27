import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import UniversityOfLisbon from '@/assets/ULISBOA_HORIZONTAL_NEG_RGB.png';
import UniversityOfGlasgow from '@/assets/UoG_white.png';
import { HostInstitutionLogos } from '@/components/PresentationComponents/HostInstitutionLogos/HostInstitutionLogos';
import { RootState } from '@/redux/store';
import { BLOGPAGE } from '@/share/CONST_DATA';
import '@/style/homepage.scss';
import { translationHomepage } from '@/utils/functions/translationLanguages';

export const FooterComponent = () => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedHomepage = translationHomepage(languageValue);

  return (
    <div className="footer-container">
      <div
        className="aos-container aos-init aos-animate"
        data-aos="fade-in"
        data-aos-easing="ease"
        data-aos-duration="500"
      >
        <div className="logo-grid-container">
          <div
            className="logo-grid logo-grid--primary"
            data-footer-logo-row="primary"
          >
            <HostInstitutionLogos placement="footer" />
            <Link
              to="https://emory.edu/"
              target="_blank"
              rel="noopener"
              aria-label="Emory University"
            >
              <div className="logo-grid-item fade-in" style={{ width: 250 }}>
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/emory_white_500_130.png"
                  aria-label="Emory University"
                  src="https://api.slavevoyages.org/static/uploads/emory_white_500_130.png"
                  data-was-processed="true"
                />
              </div>
            </Link>

            <Link
              to="https://nmaahc.si.edu/"
              target="_blank"
              rel="noopener"
              aria-label="National Museum of African American History and Culture"
            >
              <div className="logo-grid-item fade-in">
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/nmaahc_white_7510_3126.png"
                  aria-label="National Museum of African American History and Culture"
                  src="https://api.slavevoyages.org/static/uploads/nmaahc_white_7510_3126.png"
                  data-was-processed="true"
                />
              </div>
            </Link>

            <Link
              to="https://oieahc.wm.edu/"
              target="_blank"
              rel="noopener"
              aria-label="Omohundro Institute"
            >
              <div className="logo-grid-item fade-in" style={{ width: 150 }}>
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/oi_white_686_528.png"
                  aria-label="Omohundro Institute"
                  src="https://api.slavevoyages.org/static/uploads/oi_white_686_528.png"
                  data-was-processed="true"
                />
              </div>
            </Link>
            <Link
              to="https://rice.edu/"
              target="_blank"
              rel="noopener"
              aria-label="Rice University"
            >
              <div className="logo-grid-item fade-in">
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/rice_white_205_76.png"
                  aria-label="Rice University"
                  src="https://api.slavevoyages.org/static/uploads/rice_white_205_76.png"
                  data-was-processed="true"
                />
              </div>
            </Link>
          </div>
        </div>

        <div className="logo-grid-container">
          <div className="logo-grid" data-footer-logo-row="secondary">
            <div className="logo-grid-item fade-in" style={{ width: 100 }}>
              <img
                className="card-img sponsor-card-img block lazy loaded"
                data-src="https://api.slavevoyages.org/static/uploads/ucshield_white_250_250.png"
                aria-label="University of California"
                src="https://api.slavevoyages.org/static/uploads/ucshield_white_250_250.png"
                data-was-processed="true"
              />
            </div>
            <Link
              to="https://uci.edu/"
              target="_blank"
              rel="noopener"
              aria-label="University of California, Irvine"
            >
              <div className="logo-grid-item fade-in">
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/uci_noshield_white_751_240.png"
                  aria-label="University of California, Irvine"
                  src="https://api.slavevoyages.org/static/uploads/uci_noshield_white_751_240.png"
                  data-was-processed="true"
                />
              </div>
            </Link>

            <Link
              to="https://www.ucsc.edu/"
              target="_blank"
              rel="noopener"
              aria-label="University of California, Santa Cruz"
            >
              <div className="logo-grid-item fade-in">
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/ucsc_noshield_white_691_164.png"
                  aria-label="University of California, Santa Cruz"
                  src="https://api.slavevoyages.org/static/uploads/ucsc_noshield_white_691_164.png"
                  data-was-processed="true"
                />
              </div>
            </Link>

            <Link
              to="https://www.gla.ac.uk/"
              target="_blank"
              rel="noopener"
              aria-label="University Of Glasgow"
            >
              <div className="logo-grid-item fade-in">
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src=""
                  aria-label="University Of Glasgow"
                  src={UniversityOfGlasgow}
                  data-was-processed="true"
                />
              </div>
            </Link>

            <Link
              to="https://www.cavehill.uwi.edu/home"
              target="_blank"
              rel="noopener"
              aria-label="University of the West Indies at Cave Hill, Barbados (UWI)"
            >
              <div className="logo-grid-item fade-in">
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/uwi_white_crest.png"
                  aria-label="University of the West Indies at Cave Hill, Barbados (UWI)"
                  src="https://api.slavevoyages.org/static/uploads/uwi_white_crest.png"
                  data-was-processed="true"
                />
              </div>
            </Link>
            <Link
              to="https://www.ulisboa.pt"
              target="_blank"
              rel="noopener"
              aria-label="University of Lisbon"
            >
              <div className="logo-grid-item fade-in">
                <img
                  className="card-img sponsor-card-img block lazy loaded"
                  data-src="https://api.slavevoyages.org/static/uploads/ULISBOA_HORIZONTAL_NEG_RGB.png"        
                  aria-label="University of Lisbon"
                  src={UniversityOfLisbon}
                  data-was-processed="true"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
      <footer className="footer-flex-container">
        <div className="footer-copyrights">
          <div className="copyright">
            <div className="highlight">
              <Link
                to={`${BLOGPAGE}/tag/about`}
                target="_blank"
                rel="noopener"
                className="link grey"
              >
                <span className="bold">{translatedHomepage.homeFootSlave}</span>{' '}
                v2.2.13
              </Link>
            </div>
            <div className="highlight">
              {translatedHomepage.homeFootSlaveCopyright}{' '}
              <Link
                target="_blank"
                rel="noopener"
                to="https://www.gnu.org/licenses/gpl-3.0.en.html"
                className="grey"
              >
                <span className="link">
                  {' '}
                  {translatedHomepage.homeFootLicense}
                </span>
              </Link>{' '}
              {translatedHomepage.homeFootLicenseOrVersion}
            </div>
            <div className="highlight">
              {translatedHomepage.homeFootSomeContent}
              <Link
                target="_blank"
                rel="noopener"
                to="https://creativecommons.org/licenses/by-nc/3.0/us/"
                className="grey"
              >
                <span className="link">
                  {translatedHomepage.homeFootCreative}
                </span>
              </Link>
              .
            </div>
          </div>
        </div>

        <div className="footer-logo">
          <i>{translatedHomepage.homeFootPowerBy}</i>
          <br />
          <Link
            target="_blank"
            rel="noopener"
            to="https://www.oracle.com/oracle-for-research/?source=:ex:pw:::::RiceSlaveVoyages&amp;SC=:ex:pw:::::RiceSlaveVoyages&amp;pcode="
            className="link"
          >
            <img
              aria-label="Powered by Oracle for Research"
              src="https://api.slavevoyages.org/static/uploads/oci_white_206_63.png"
              style={{ height: 35 }}
            />
          </Link>
        </div>
      </footer>
    </div>
  );
};
