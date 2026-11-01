import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SafeAreaProps {
  children: ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * SafeArea component that adds padding for mobile safe areas
 * Use this to ensure content is not hidden by notches, status bars, or navigation bars
 */
export function SafeArea({ 
  children, 
  className,
  top = true,
  bottom = true,
  left = true,
  right = true
}: SafeAreaProps) {
  return (
    <div 
      className={cn(
        'w-full h-full',
        className
      )}
      style={{
        paddingTop: top ? 'var(--safe-area-inset-top)' : undefined,
        paddingBottom: bottom ? 'var(--safe-area-inset-bottom)' : undefined,
        paddingLeft: left ? 'var(--safe-area-inset-left)' : undefined,
        paddingRight: right ? 'var(--safe-area-inset-right)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

/**
 * StatusBarSpacer component that adds spacing for the status bar
 * Use this at the top of your page to push content below the status bar
 */
export function StatusBarSpacer({ className }: { className?: string }) {
  return (
    <div 
      className={cn('w-full', className)}
      style={{ height: 'var(--safe-area-inset-top)' }}
    />
  );
}

/**
 * NavigationBarSpacer component that adds spacing for the bottom navigation bar
 * Use this at the bottom of your page to ensure content is not hidden by the navigation bar
 */
export function NavigationBarSpacer({ className }: { className?: string }) {
  return (
    <div 
      className={cn('w-full', className)}
      style={{ height: 'var(--safe-area-inset-bottom)' }}
    />
  );
}
