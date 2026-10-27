import { CaretDownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { usePageRouter } from '@/hooks/usePageRouter';
import { setBlogPost } from '@/redux/getBlogDataSlice';
import { setDataSetHeader } from '@/redux/getDataSetCollectionSlice';
import { setLanguages, setLanguagesLabel } from '@/redux/getLanguagesSlice';
import { setDataSetPeopleEnslavedHeader } from '@/redux/getPeopleEnslavedDataSetCollectionSlice';
import { setDataSetEnslaversHeader } from '@/redux/getPeopleEnslaversDataSetCollectionSlice';
import { RootState } from '@/redux/store';
import { BlogDataProps } from '@/share/InterfaceTypesBlog';
import { checkHeaderTitleLanguages } from '@/utils/functions/checkHeaderTitleLanguages';
import { LanguageOptions } from '@/utils/functions/languages';

export default function LanguagesDropdown() {
  const dispatch = useDispatch();
  const { languageValueLabel } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const {
    styleName: styleNameRoute,
    endpointPathEstimate,
    endpointPath,
  } = usePageRouter();
  const post = useSelector(
    (state: RootState) => state.getBlogData.post as BlogDataProps,
  );

  const handleChangeLanguage = (value: string, label: string) => {
    dispatch(setLanguages(value));
    dispatch(setLanguagesLabel(label));
    dispatch(setBlogPost(post as BlogDataProps));
    const hederTitleName = checkHeaderTitleLanguages(value, styleNameRoute!);
    dispatch(setDataSetHeader(hederTitleName));
    dispatch(setDataSetPeopleEnslavedHeader(hederTitleName));
    dispatch(setDataSetEnslaversHeader(hederTitleName));
    localStorage.setItem('languages', value);
  };

  // Dynamic color calculation
  let colorText = '#ffffff';
  if (
    endpointPathEstimate === 'estimates' ||
    endpointPath === 'accounts' ||
    endpointPath === 'contribute'
  ) {
    colorText = '#ffffff';
  } else if (styleNameRoute === '' || styleNameRoute === 'PastHomePage') {
    colorText = 'rgba(0, 0, 0, 0.85)';
  }
  const fontSize = '0.8rem';

  // Create menu items for dropdown
  const menuItems: MenuProps['items'] = LanguageOptions.map((lag) => ({
    key: lag.value,
    label: lag.language,
    style: { fontSize: fontSize },
    onClick: () => handleChangeLanguage(lag.value, lag.lable),
  }));

  const menu: MenuProps = {
    items: menuItems,
  };

  // Base button styles
  const baseButtonStyle = {
    color: colorText,
    fontSize: fontSize,
    fontWeight: 600,
    textTransform: 'none' as const,
    background: 'none',
    border: 'none',
    boxShadow: 'none',
    padding: '4px 8px',
  };

  // Event handlers to maintain consistent styling across states
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.background = 'none';
    target.style.border = 'none';
    target.style.boxShadow = 'none';
    target.style.color = colorText;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.background = 'none';
    target.style.border = 'none';
    target.style.boxShadow = 'none';
    target.style.color = colorText;
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.background = 'none';
    target.style.border = 'none';
    target.style.boxShadow = 'none';
    target.style.color = colorText;
    target.style.outline = 'none';
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.style.background = 'none';
    target.style.border = 'none';
    target.style.boxShadow = 'none';
    target.style.color = colorText;
  };

  return (
    <div className="select-languages">
      <Dropdown
        menu={menu}
        trigger={['click']}
        overlayStyle={{
          width: styleNameRoute ? 'auto' : '150px',
        }}
      >
        <Button
          style={baseButtonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {languageValueLabel}
          <CaretDownOutlined
            style={{
              fontSize: '0.9rem',
              marginLeft: '4px',
              marginTop: '4px',
              display: window.innerWidth >= 768 ? 'inline' : 'none',
            }}
          />
        </Button>
      </Dropdown>
    </div>
  );
}
