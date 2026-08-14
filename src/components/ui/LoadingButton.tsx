import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

/**
 * Reusable button that adds a loading state on top of the existing
 * admin panel button design. The visual style is fully controlled by the
 * caller via `className` — this component only manages the spinner,
 * disabled state, and aria-busy attribute while an async action runs.
 */
export default function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${className} ${loading ? 'pointer-events-none opacity-80' : ''}`.trim()}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
