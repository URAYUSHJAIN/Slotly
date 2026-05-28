/**
 * Badge — design.md status pill
 * Variants: primary | success | warning | error | info | neutral
 */
export function Badge({ variant = 'primary', children, className = '' }) {
  const variantClass = {
    primary: 'badge--primary',
    success: 'badge--success',
    warning: 'badge--warning',
    error:   'badge--error',
    info:    'badge--info',
    neutral: 'badge--neutral',
  }[variant] ?? 'badge--primary';

  return (
    <span className={['badge', variantClass, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
