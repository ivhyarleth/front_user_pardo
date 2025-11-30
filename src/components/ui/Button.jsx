import { cn } from '../../lib/utils';

const Button = ({
  children,
  variant = 'default',
  size = 'default',
  className,
  disabled,
  ...props
}) => {
  const variants = {
    default: 'bg-pardos-rust hover:bg-pardos-brown text-white',
    primary: 'bg-pardos-purple hover:bg-pardos-brown text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border-2 border-pardos-rust text-pardos-rust hover:bg-pardos-rust hover:text-white',
    ghost: 'hover:bg-gray-100 text-gray-900',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-spartan font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };

