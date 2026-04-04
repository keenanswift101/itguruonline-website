import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && errorId ? errorId : undefined}
        className={`h-10 rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "ring-2 ring-error border-error" : ""
        } ${className}`}
        {...props}
      />
      {error && <p id={errorId} role="alert" className="text-sm text-error">{error}</p>}
    </div>
  );
}
