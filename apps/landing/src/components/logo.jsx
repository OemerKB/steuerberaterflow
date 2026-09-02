export function Logo({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#176B4D" />
      <path d="M9 21.5L14 13l4 6 5-9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
