import { Map, point, Point, Popup, PopupEvent } from 'leaflet';

export function keepMapPopupsVisible(map: Map) {
  const originalOptions = new WeakMap<
    Popup,
    { maxWidth: number; minWidth: number; topLeft: Point }
  >();
  let active: Popup | undefined;

  const fit = () => {
    if (!active) return;
    const element = active.getElement();
    const content = element?.querySelector<HTMLElement>(
      '.leaflet-popup-content',
    );
    const original = originalOptions.get(active);
    if (!element || !content || !original) return;

    // Leaflet's maxWidth limits only the content. Include the measured
    // margins/padding and its auto-pan clearance so the close button fits too.
    const options = active.options;
    const left = original.topLeft.x;
    const right = point(
      options.autoPanPaddingBottomRight || options.autoPanPadding || [5, 5],
    ).x;
    const chrome = element.offsetWidth - content.offsetWidth;
    const available = Math.floor(map.getSize().x - chrome - left - right - 1);
    if (available <= 0) return;
    options.maxWidth = Math.min(original.maxWidth, available);
    options.minWidth = Math.min(original.minWidth, options.maxWidth);
    // Leaflet's zoom buttons sit above the popup pane. Auto-pan also needs
    // clearance for their height so a tall popup can keep its first line visible.
    const container = map.getContainer();
    const zoom = container.querySelector(
      '.leaflet-top.leaflet-left .leaflet-control-zoom',
    );
    const bottom = zoom
      ? zoom.getBoundingClientRect().bottom -
        container.getBoundingClientRect().top
      : 0;
    options.autoPanPaddingTopLeft = point(
      left,
      Math.max(0, bottom) + original.topLeft.y,
    );
    active.update();
  };
  const open = ({ popup }: PopupEvent) => {
    active = popup;
    if (!originalOptions.has(popup)) {
      originalOptions.set(popup, {
        maxWidth: popup.options.maxWidth ?? 300,
        minWidth: popup.options.minWidth ?? 50,
        topLeft: point(
          popup.options.autoPanPaddingTopLeft ||
            popup.options.autoPanPadding || [5, 5],
        ),
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
