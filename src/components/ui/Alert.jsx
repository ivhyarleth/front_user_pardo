import { cn } from '../../lib/utils';

const Alert = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-white border-gray-200 text-gray-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border px-4 py-3 text-sm',
        variants[variant],
        className
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className, ...props }) => {
  return (
    <h5
      className={cn('mb-1 font-bold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  );
};

const AlertDescription = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Alert, AlertTitle, AlertDescription };

