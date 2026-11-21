type Props = { size?: number; className?: string; label?: string };

export function SellerHubSpinner({
  size = 48,
  className = "",
  label = "Loading",
}: Props) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex text-primary ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" className="size-full">
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="4"
        />
        <g className="origin-center animate-spin [animation-duration:900ms]">
          <path
            d="M24 4a20 20 0 0 1 20 20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <g className="origin-center animate-spin [animation-duration:1600ms] [animation-direction:reverse]">
          <circle
            cx="24"
            cy="10"
            r="2.5"
            fill="currentColor"
            fillOpacity="0.5"
          />
        </g>
        <circle
          cx="24"
          cy="24"
          r="5"
          fill="currentColor"
          className="origin-center animate-pulse"
        />
      </svg>
    </span>
  );
}

export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3">
      <SellerHubSpinner size={56} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
