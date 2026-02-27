import React from 'react';
import { cn } from '../../lib/utils';

const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-brown-300';

const variants = {
  default: 'bg-toasted-almond-500 text-white hover:bg-toasted-almond-600',
  outline: 'border border-stone-brown-100 bg-white text-stone-brown-900 hover:bg-stone-brown-50',
  ghost: 'text-stone-brown-700 hover:bg-stone-brown-50'
};

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-6',
  icon: 'h-10 w-10'
};

const Button = React.forwardRef(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

export { Button };
