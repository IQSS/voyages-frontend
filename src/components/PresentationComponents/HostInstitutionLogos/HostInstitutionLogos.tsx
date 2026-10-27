import HlsFooterLogo from '@/assets/hosting/hls-white.png';
import HlsHeroLogo from '@/assets/hosting/hls-white-crimson.png';
import HutchinsFooterLogo from '@/assets/hosting/hutchins-white.png';
import HutchinsHeroLogo from '@/assets/hosting/hutchins-white-gold.png';
import IqssFooterLogo from '@/assets/hosting/iqss-white.png';
import IqssHeroLogo from '@/assets/hosting/iqss-white-orange.png';

export const HOST_INSTITUTIONS = [
  {
    id: 'hutchins',
    label: 'Hutchins Center for African and African American Research',
    href: 'https://hutchinscenter.fas.harvard.edu/',
    logos: {
      hero: HutchinsHeroLogo,
      footer: HutchinsFooterLogo,
    },
  },
  {
    id: 'hls',
    label: 'Harvard & the Legacy of Slavery Initiative',
    href: 'https://legacyofslavery.harvard.edu/',
    logos: {
      hero: HlsHeroLogo,
      footer: HlsFooterLogo,
    },
  },
  {
    id: 'iqss',
    label: 'Institute for Quantitative Social Science',
    href: 'https://www.iq.harvard.edu/',
    logos: {
      hero: IqssHeroLogo,
      footer: IqssFooterLogo,
    },
  },
] as const;

type HostInstitutionLogoPlacement = 'hero' | 'footer';

interface HostInstitutionLogosProps {
  placement: HostInstitutionLogoPlacement;
}

export const HostInstitutionLogos = ({
  placement,
}: HostInstitutionLogosProps) => (
  <div
    className={`host-institution-logos host-institution-logos--${placement}`}
    data-host-logo-group={placement}
  >
    {HOST_INSTITUTIONS.map((institution) => (
      <a
        className={`host-institution-logo-link host-institution-logo-link--${placement}`}
        data-host-institution={institution.id}
        href={institution.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={institution.label}
        key={institution.id}
      >
        <img src={institution.logos[placement]} alt="" aria-hidden="true" />
      </a>
    ))}
  </div>
);
