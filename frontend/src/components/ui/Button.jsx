import { cn } from '../../lib/utils';
import { forwardRef } from 'react';

const Button = forwardRef(({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
  const variants = {
    primary: "bg-accent text-white font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:opacity-90",
    secondary: "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white font-black uppercase tracking-widest shadow-sm",
    accent: "bg-accent text-white font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:opacity-90",
    outline: "bg-transparent text-primary border-2 border-primary/50 hover:bg-primary/10 font-black uppercase tracking-widest",
    ghost: "bg-transparent text-earth-sub hover:bg-earth-card-alt hover:text-earth-brown font-bold",
    destructive: "bg-red-500 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] rounded-xl",
    md: "px-6 py-3 text-xs rounded-2xl",
    lg: "px-8 py-4 text-sm rounded-2xl",
    icon: "p-3 rounded-xl flex items-center justify-center",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };
