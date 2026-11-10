import { Map, point, Popup, PopupEvent } from 'leaflet';

export function keepMapPopupsVisible(map: Map) {
  const originalWidths = new WeakMap<
    Popup,
    { maxWidth: number; minWidth: number }
  >();
  let active: Popup | undefined;

  const fit = () => {
    if (!active) return;
    const element = active.getElement();
    const content = element?.querySelector<HTMLElement>(
      '.leaflet-popup-content',
    );
    const original = originalWidths.get(active);
    if (!element || !content || !original) return;

    // Leaflet's maxWidth limits only the content. Include the measured
    // margins/padding and its auto-pan clearance so the close button fits too.
    const options = active.options;
    const left = point(
      options.autoPanPaddingTopLeft || options.autoPanPadding || [5, 5],
    ).x;
    const right = point(
      options.autoPanPaddingBottomRight || options.autoPanPadding || [5, 5],
    ).x;
    const chrome = element.offsetWidth - content.offsetWidth;
    const available = Math.floor(map.getSize().x - chrome - left - right - 1);
    if (available <= 0) return;
    options.maxWidth = Math.min(original.maxWidth, available);
    options.minWidth = Math.min(original.minWidth, options.maxWidth);
    active.update();
  };
  const open = ({ popup }: PopupEvent) => {
    active = popup;
    if (!originalWidths.has(popup)) {
      originalWidths.set(popup, {
        maxWidth: popup.options.maxWidth ?? 300,
        minWidth: popup.options.minWidth ?? 50,
      });
    }
    fit();
  };
  const close = () => {
    active = undefined;
  };
  map.on('popupopen', open);
  map.on('popupclose', close);
  map.on('resize', fit);
  return () => {
    map.off('popupopen', open);
    map.off('popupclose', close);
    map.off('resize', fit);
  };
}
