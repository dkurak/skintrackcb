import Link from 'next/link';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  href?: string;
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

export function Avatar({ src, name, size = 'md', href, className = '' }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initial = (name || '?')[0].toUpperCase();

  const avatarContent = src ? (
    <img
      src={src}
      alt={name || 'Avatar'}
      className={`${sizeClass} rounded-full object-cover ${className}`}
    />
  ) : (
    <div
      className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 ${className}`}
    >
      {initial}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {avatarContent}
      </Link>
    );
  }

  return <div className="flex-shrink-0">{avatarContent}</div>;
}

// Colored variants for specific contexts
interface ColoredAvatarProps extends AvatarProps {
  variant?: 'default' | 'green' | 'purple' | 'blue';
}

const VARIANT_CLASSES = {
  default: 'bg-gray-200 text-gray-500',
  green: 'bg-green-200 text-green-700',
  purple: 'bg-purple-200 text-purple-700',
  blue: 'bg-blue-200 text-blue-700',
};

export function ColoredAvatar({ src, name, size = 'md', href, variant = 'default', className = '' }: ColoredAvatarProps) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;
  const initial = (name || '?')[0].toUpperCase();

  const avatarContent = src ? (
    <img
      src={src}
      alt={name || 'Avatar'}
      className={`${sizeClass} rounded-full object-cover ${className}`}
    />
  ) : (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${variantClass} ${className}`}
    >
      {initial}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {avatarContent}
      </Link>
    );
  }

  return <div className="flex-shrink-0">{avatarContent}</div>;
}
