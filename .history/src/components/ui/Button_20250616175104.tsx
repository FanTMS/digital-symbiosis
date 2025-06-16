import React, { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:ring-offset-2 shadow-sm";

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-primary-500 via-sky-500 to-primary-600 text-white hover:shadow-xl hover:from-primary-400 hover:to-sky-500 active:scale-95 focus:ring-4 focus:ring-primary-300/40 focus:ring-offset-2 duration-150",
    secondary:
      "bg-gradient-to-r from-secondary-500 via-pink-400 to-secondary-600 text-white hover:shadow-xl hover:from-secondary-400 hover:to-pink-400 active:scale-95 focus:ring-4 focus:ring-secondary-300/40 focus:ring-offset-2 duration-150",
    outline:
      "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 active:bg-gray-100",
    ghost: "bg-transparent text-gray-800 hover:bg-gray-100 active:bg-gray-200",
    danger:
      "bg-gradient-to-r from-error-500 to-error-600 text-white hover:shadow-lg hover:shadow-error-500/25 active:scale-95",
    success:
      "bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/25 active:scale-95",
  };

  const sizeStyles = {
    sm: "text-xs px-4 py-2",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-6 py-3",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${disabled || isLoading ? "cursor-not-allowed opacity-70" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <motion.svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </motion.svg>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export default Button;
