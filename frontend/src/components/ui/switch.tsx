import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'w-11 h-6 rounded-full transition-colors',
              props.checked ? 'bg-primary' : 'bg-gray-300',
              className
            )}
          >
            <div
              className={cn(
                'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                props.checked ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </div>
        </div>
        {label && <span className="text-sm">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };

