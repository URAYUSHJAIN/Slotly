/**
 * Button — design.md §11
 * Variants: primary | secondary | ghost
 * Sizes:    default (52px) | sm (40px)
 * Also exports IconButton for circular icon-only actions.
 */

export function Button({
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  ...props
}) {
  const variantClass = {
    primary:   'btn--primary',
    secondary: 'btn--secondary',
    ghost:     'btn--ghost',
  }[variant] ?? 'btn--primary';

  const sizeClass = size === 'sm' ? 'btn--sm' : '';

  return (
    <button
      className={['btn', variantClass, sizeClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * IconButton — circular, 48 px minimum (design.md §11 Icon Button)
 * variant: default | primary
 * size:    default (48px) | lg (56px)
 */
export function IconButton({
  variant = 'default',
  size = 'default',
  children,
  className = '',
  label,
  ...props
}) {
  const variantClass = variant === 'primary' ? 'btn-icon--primary' : '';
  const sizeClass    = size === 'lg' ? 'btn-icon--lg' : '';

  return (
    <button
      className={['btn-icon', variantClass, sizeClass, className].filter(Boolean).join(' ')}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}
