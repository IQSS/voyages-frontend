import { useSelector } from 'react-redux';

import XICON from '@/assets/pages/X_icon.svg';
import BackGroundVideo from '@/assets/wavesBG.mp4';
import { HostInstitutionLogos } from '@/components/PresentationComponents/HostInstitutionLogos/HostInstitutionLogos';
import { RootState } from '@/redux/store';
import '@/style/page.scss';
import { translationHomepage } from '@/utils/functions/translationLanguages';

const VideoBackground = () => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedHomepage = translationHomepage(languageValue);

  return (
    <div className="video-background">
      <video autoPlay muted loop>
        <source src={BackGroundVideo} type="video/mp4" />
      </video>
      <div
        className="bgvid-container aos-init aos-animate"
        data-aos="fade-in"
        data-aos-easing="ease"
        data-aos-delay="1700"
        data-aos-duration="500"
        data-aos-anchor="#bgvid-container"
      >
        <div className="social-flex-container">
          <div className="social-icon-container social-icon-container--utilities">
            <span>
              <a
                href="https://www.facebook.com/Voyages-The-Trans-Atlantic-Slave-Trade-Database-125441173016/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  data-src="https://api.slavevoyages.org/static/uploads/fb.png"
                  className="social-icon lazy initial loaded"
                  alt="Facebook Logo"
                  src="https://api.slavevoyages.org/static/uploads/fb.png"
                  data-was-processed="true"
                />
              </a>
              <a
                href="https://twitter.com/slavevoyages"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  data-src="https://api.slavevoyages.org/static/uploads/X_icon.png"
                  className="social-icon-x lazy initial loaded"
                  alt="Twitter Logo"
                  src={XICON}
                  data-was-processed="true"
                />
              </a>
              <span className="separator">|</span>
              <a
                href="https://airtable.com/appZmGW1SJBCvNVkS/pagCykoWOYCdlEryO/form"
                data-toggle="tooltip"
                data-placement="top"
                title=""
                className="social-icon lazy initial"
                target="_blank"
                rel="noopener noreferrer"
                data-was-processed="true"
                data-original-title="Provide your thoughts and suggestions about the Slave Voyages site."
              >
                <img
                  className="legacy-icon"
                  src="https://api.slavevoyages.org/static/uploads/feedback.png"
                  alt="Feedback Button"
                />
                <span className="separator">
                  {translatedHomepage.userFeedback}
                </span>
              </a>
              <a
                href="https://airtable.com/appZmGW1SJBCvNVkS/pagCykoWOYCdlEryO/form"
                data-toggle="tooltip"
                data-placement="top"
                title=""
                className="social-icon lazy initial"
                target="_blank"
                rel="noopener noreferrer"
                data-was-processed="true"
                data-original-title="Report a specific issue/bug found on the site."
              >
                <img
                  className="legacy-icon"
                  src="https://api.slavevoyages.org/static/uploads/bug.png"
                  alt="Issue Button"
                />
                <span className="separator">
                  {translatedHomepage.reportIssue}
                </span>
              </a>
            </span>
            <div className="scroll">{translatedHomepage.scrollMore}</div>
          </div>

          <HostInstitutionLogos placement="hero" />
        </div>
      </div>
    </div>
  );
};

export default VideoBackground;
