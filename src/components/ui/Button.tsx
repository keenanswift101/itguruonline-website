import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-500",
  secondary:
    "border border-primary-700 text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500",
  ghost:
    "text-primary-700 hover:bg-[var(--bg-surface)] focus:ring-primary-500",
  danger:
    "bg-error text-white hover:bg-red-700 focus:ring-red-500",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-[10px]",
  md: "h-10 px-4 text-base rounded-[10px]",
  lg: "h-12 px-6 text-lg rounded-[10px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    if (props.disabled) {
      return (
        <span
          className={`${classes} opacity-50 cursor-not-allowed pointer-events-none`}
          aria-disabled="true"
          role="link"
        >
          {children}
        </span>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
