/**
 * Card — design.md §12
 * Variants: default (white surface) | floating (glass backdrop)
 */

export function Card({
  variant = 'default',
  children,
  className = '',
  ...props
}) {
  const variantClass = variant === 'floating' ? 'card--floating' : '';

  return (
    <div
      className={['card', variantClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card__header ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`card__title ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`card__description ${className}`}>{children}</p>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card__footer ${className}`}>{children}</div>;
}
