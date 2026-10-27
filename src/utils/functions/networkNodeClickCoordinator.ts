export const NETWORK_NODE_SINGLE_CLICK_DELAY_MS = 300;

export interface NetworkNodeClickCoordinator {
  handleClick: (
    clickCount: number,
    openCard: () => void,
    expandNode: () => void | Promise<void>,
  ) => void;
  cancel: () => void;
}

export const createNetworkNodeClickCoordinator = (
  delayMs = NETWORK_NODE_SINGLE_CLICK_DELAY_MS,
): NetworkNodeClickCoordinator => {
  let pendingSingleClick: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    if (pendingSingleClick !== undefined) {
      clearTimeout(pendingSingleClick);
      pendingSingleClick = undefined;
    }
  };

  const handleClick: NetworkNodeClickCoordinator['handleClick'] = (
    clickCount,
    openCard,
    expandNode,
  ) => {
    cancel();
    if (clickCount === 1) {
      pendingSingleClick = setTimeout(() => {
        pendingSingleClick = undefined;
        openCard();
      }, delayMs);
    } else if (clickCount === 2) {
      void expandNode();
    }
  };

  return { handleClick, cancel };
};
