import { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const DialogContext = createContext();

const Dialog = ({ children, open, onOpenChange }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ children, asChild }) => {
  const { onOpenChange } = useContext(DialogContext);
  
  if (asChild) {
    return children;
  }
  
  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
};

const DialogPortal = ({ children }) => {
  const { open } = useContext(DialogContext);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      {children}
    </div>
  );
};

const DialogOverlay = ({ className, ...props }) => {
  const { onOpenChange } = useContext(DialogContext);
  
  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0',
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
};

const DialogContent = ({ children, className, ...props }) => {
  const { onOpenChange } = useContext(DialogContext);
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
        <div
          className={cn(
            'relative bg-white rounded-2xl shadow-2xl p-6 mx-4 animate-in fade-in-0 zoom-in-95 duration-200',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
      </div>
    </DialogPortal>
  );
};

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}
    {...props}
  />
);

const DialogTitle = ({ className, ...props }) => (
  <h2
    className={cn(
      'text-2xl font-spartan font-bold text-pardos-dark leading-none tracking-tight',
      className
    )}
    {...props}
  />
);

const DialogDescription = ({ className, ...props }) => (
  <p
    className={cn('text-sm font-lato text-gray-600', className)}
    {...props}
  />
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6',
      className
    )}
    {...props}
  />
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};

