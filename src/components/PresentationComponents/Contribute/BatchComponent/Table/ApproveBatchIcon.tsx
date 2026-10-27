/**
 * A "window with a check badge" mark for the batch Approve action — a panel of
 * records with an approval tick, so it reads as "approve these" rather than a
 * plain checkmark (which looks like an already-done status). Inherits the
 * button's colour via currentColor; the tick and the ring around the badge are
 * drawn in the surface colour so the badge stays legible where it overlaps the
 * window outline.
 */
export const ApproveBatchIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {/* window / panel */}
    <rect
      x="2"
      y="4"
      width="13"
      height="12"
      rx="2.4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <line
      x1="2"
      y1="8"
      x2="15"
      y2="8"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="4.7" cy="6" r="0.7" fill="currentColor" />
    <circle cx="6.9" cy="6" r="0.7" fill="currentColor" />
    <rect
      x="8.6"
      y="5.3"
      width="5.4"
      height="1.5"
      rx="0.75"
      fill="currentColor"
    />
    {/* approval badge, offset to the bottom-right corner */}
    <circle
      cx="17"
      cy="17"
      r="5.4"
      fill="currentColor"
      stroke="#fff"
      strokeWidth="1.4"
    />
    <path
      d="M14.5 17.1 L16.3 18.9 L19.6 15.2"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
