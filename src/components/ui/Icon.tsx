import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Icon as IconifyIcon } from '@iconify/react';

export interface IconProps extends Omit<React.ComponentProps<'svg'>, 'ref'> {
  name?: string; // Iconify name (e.g. "mdi:home") or Lucide icon name (e.g. "Home")
  icon?: React.ComponentType<React.ComponentPropsWithoutRef<'svg'>>; // Lucide icon component directly
  className?: string;
  size?: number | string;
}

const lucideRegistry = LucideIcons as unknown as Record<string, React.ComponentType<React.ComponentPropsWithoutRef<'svg'>>>;

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, icon: IconComponent, className, size = 20, ...props }, ref) => {
    // If a Lucide icon component is passed directly, render it
    if (IconComponent) {
      const Comp = IconComponent as React.ComponentType<{ className?: string; size?: number | string; ref?: React.Ref<SVGSVGElement> }>;
      return <Comp ref={ref} className={className} size={size} {...props} />;
    }

    if (!name) return null;

    // Check if it's an Iconify name (usually contains a colon like 'mdi:home' or 'logos:react')
    if (name.includes(':')) {
      return (
        <IconifyIcon
          icon={name}
          className={className}
          width={size}
          height={size}
          {...(props as Record<string, unknown>)}
        />
      );
    }

    // Otherwise, treat as a Lucide icon name
    // Lucide names are PascalCase (e.g. 'Home') or kebab-case (e.g. 'home' -> we map to PascalCase)
    const pascalName = name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const LucideIcon = lucideRegistry[pascalName] || lucideRegistry[name];

    if (LucideIcon) {
      // Cast the ref to ensure typescript alignment
      const Comp = LucideIcon as React.ComponentType<{ className?: string; size?: number | string; ref?: React.Ref<SVGSVGElement> }>;
      return <Comp ref={ref} className={className} size={size} {...props} />;
    }

    // Fallback to Iconify just in case
    return (
      <IconifyIcon
        icon={name}
        className={className}
        width={size}
        height={size}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

Icon.displayName = 'Icon';
