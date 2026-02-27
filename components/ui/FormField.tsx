import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * FormField wraps any input/select/textarea with a consistent label + error treatment.
 * Use it when you need more control than the built-in `label` prop on <Input> / <Select>.
 */
const FormField: React.FC<FormFieldProps> = ({ label, error, hint, required, children }) => {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 ml-1">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-zinc-400 ml-1">{hint}</p>
      )}
    </div>
  );
};

export default FormField;
