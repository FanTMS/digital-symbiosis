import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

// Типизация framer-motion часто конфликтует с HTML props, поэтому упрощаем
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const MotionButton: any = motion.button;

type Variant = 'primary' | 'outline' | 'ghost' | 'success' | 'danger' | 'icon';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base = 'inline-flex gap-2 items-center justify-center font-semibold rounded-xl focus:outline-none transition-all duration-200 shadow-card';
const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
  outline: 'ring-1 ring-gray-300 text-gray-800 hover:bg-gray-light active:bg-gray-100',
  ghost: 'text-gray-800 hover:bg-gray-light active:bg-gray-200',
  success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700',
  danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700',
  icon: 'bg-primary-500 text-white rounded-full hover:bg-primary-600 active:bg-primary-700',
};

const sizes: Record<Size, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
  icon: 'w-10 h-10 flex items-center justify-center',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth,
    isLoading,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const width = fullWidth ? 'w-full' : '';
    const sizeKey: Size = variant === 'icon' ? 'icon' : size;
    return (
      <MotionButton
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[sizeKey]} ${width} ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3 3 3H4z" />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="-ml-1">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="-mr-1">{rightIcon}</span>}
          </>
        )}
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
