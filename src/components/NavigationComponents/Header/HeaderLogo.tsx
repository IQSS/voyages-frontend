import { Button } from 'antd';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import LOGOVoyages from '@/assets/sv-logo.png';
import LOGOVoyagesPeople from '@/assets/sv-logo_v2.svg';
import { usePageRouter } from '@/hooks/usePageRouter';
import { setInputSearchValue } from '@/redux/getCommonGlobalSearchResultSlice';
import { resetAllStateToInitailState } from '@/redux/resetAllSlice';
import { resetBlockNameAndPageName } from '@/redux/resetBlockNameAndPageName';
import { AppDispatch } from '@/redux/store';
import '@/style/Nav.scss';

export default function HeaderLogo() {
  const dispatch: AppDispatch = useDispatch();
  const { styleName } = usePageRouter();

  const onChangePath = () => {
    dispatch(resetAllStateToInitailState());
    dispatch(resetBlockNameAndPageName());
    dispatch(setInputSearchValue(''));
    localStorage.clear();
  };

  return (
    <div>
      <Button
        type="text"
        onClick={onChangePath}
        style={{
          padding: 0,
          height: 'auto',
          border: 'none',
          background: 'none',
        }}
        aria-label="Go to home"
      >
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'inline-block' }}
          tabIndex={-1}
        >
          <img
            className="logo-voyage"
            src={styleName === 'PastHomePage' ? LOGOVoyagesPeople : LOGOVoyages}
            alt="voyage logo"
          />
        </Link>
      </Button>
    </div>
  );
}
