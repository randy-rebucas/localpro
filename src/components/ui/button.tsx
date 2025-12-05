import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      default: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
      outline: 'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white',
      secondary: 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white',
      ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white',
      link: 'text-emerald-400 underline-offset-4 hover:underline hover:text-emerald-300',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
));

Button.displayName = 'Button';

export { Button };
