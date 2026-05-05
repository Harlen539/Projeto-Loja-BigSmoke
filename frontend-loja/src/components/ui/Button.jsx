export function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} type="button" {...props}>
      {children}
    </button>
  );
}
