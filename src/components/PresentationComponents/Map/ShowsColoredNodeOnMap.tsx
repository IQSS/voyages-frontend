import { useLayoutEffect, useRef, useState } from 'react';

import { usePageRouter } from '@/hooks/usePageRouter';
import { ESTIMATES } from '@/share/CONST_DATA';
import '@/style/map.scss';

const LEGEND_BUFFER_PX = 12;

const clippingAncestors = (frame: HTMLElement) => {
  const ancestors: HTMLElement[] = [];
  for (let el = frame.parentElement; el; el = el.parentElement) {
    if (getComputedStyle(el).overflowY !== 'visible') ancestors.push(el);
  }
  return ancestors;
};

const ShowsColoredNodeOnMap = () => {
  const { styleName } = usePageRouter();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [hiddenBelow, setHiddenBelow] = useState(0);

  useLayoutEffect(() => {
    const frame = anchorRef.current?.offsetParent as HTMLElement | null;
    if (!frame) return;
    const ancestors = clippingAncestors(frame);
    const update = () => {
      const frameBottom = frame.getBoundingClientRect().bottom;
      const clipBottom = Math.min(
        frameBottom,
        ...ancestors.map((el) => el.getBoundingClientRect().bottom),
      );
      setHiddenBelow(Math.max(0, Math.round(frameBottom - clipBottom)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    ancestors.forEach((el) => observer.observe(el));
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={anchorRef}
      className="map-legend-anchor"
      style={{ bottom: LEGEND_BUFFER_PX + hiddenBelow }}
    >
      <div className="legend leaflet-control">
        <table className="legendtable">
          <tbody>
            {styleName !== ESTIMATES && (
              <tr>
                <td>
                  <div className="circle origins"></div>
                </td>
                <td> </td>
                <td>
                  Origins
                  <span
                    id="origins_map_key_pill"
                    data-toggle="tooltip"
                    className="badge badge-pill badge-secondary tooltip-pointer"
                    title=""
                    data-original-title="Origins are derived from user contributions."
                  >
                    (IMP)
                  </span>
                </td>
              </tr>
            )}
            <tr>
              <td>
                <div className="circle embarkations"></div>
              </td>
              <td> </td>
              <td>Embarkations</td>
            </tr>
            {styleName !== ESTIMATES && (
              <tr>
                <td>
                  <div className="circle embark-disembark"></div>
                </td>
                <td> </td>
                <td>Embark &amp; Disembark</td>
              </tr>
            )}
            <tr>
              <td>
                <div className="circle disembarkations"></div>
              </td>
              <td> </td>
              <td>Disembarkations</td>
            </tr>
            {styleName !== ESTIMATES && (
              <tr>
                <td>
                  <div className="circle  post-disembark-location"></div>
                </td>
                <td> </td>
                <td>Post-Disembark Locations</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ShowsColoredNodeOnMap;
