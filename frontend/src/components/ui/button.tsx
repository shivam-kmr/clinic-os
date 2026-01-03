import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, children, disabled, type, ...props }, ref) => {
    const mergedClassName = cn(
      buttonVariants({ variant, size, className }),
      // When rendering asChild (e.g. <a>), "disabled:" styles won't apply, so add them explicitly.
      asChild && disabled && 'pointer-events-none opacity-50'
    );

    if (asChild) {
      if (!React.isValidElement(children)) return null;
      const child = children as React.ReactElement<any>;
      const childProps = child.props as any;

      const childOnClick = childProps?.onClick as React.MouseEventHandler | undefined;
      const onClick: React.MouseEventHandler = (e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        childOnClick?.(e);
      };

      return React.cloneElement(child as any, {
        ...(props as any),
        className: cn(mergedClassName, childProps?.className),
        onClick,
        'aria-disabled': disabled || undefined,
        tabIndex: disabled ? -1 : childProps?.tabIndex,
      } as any);
    }

    return (
      <button
        className={mergedClassName}
        ref={ref}
        disabled={disabled}
        type={type}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

