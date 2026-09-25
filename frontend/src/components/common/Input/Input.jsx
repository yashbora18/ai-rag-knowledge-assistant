import { forwardRef } from "react";
import "./Input.css";

const Input = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder = "",
      value,
      onChange,
      error,
      helperText,
      disabled = false,
      required = false,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`input-field ${className}`}>
        {label && (
          <label htmlFor={name} className="input-label">
            {label}
            {required && <span className="input-required">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`input-control ${error ? "input-error" : ""}`}
          {...props}
        />

        {error && <p className="input-message input-message-error">{error}</p>}

        {!error && helperText && (
          <p className="input-message">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;