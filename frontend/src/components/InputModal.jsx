import React from 'react';

const InputModal = ({
  open,
  title,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  onClose,
  submitText = 'Submit',
  disabled = false,
}) => {
  if (!open) return null;

  const handleChange = (e) => onChange?.(e.target.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative">
        <button
          aria-label="Close"
          className="absolute right-5 top-5 text-holly-500 hover:text-holly-700"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold text-holly-700 mb-4">{title}</h3>
        <form onSubmit={disabled ? (e) => e.preventDefault() : onSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-holly-600">
            {label}
            <input
              type="text"
              required
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              disabled={disabled}
              className="mt-2 w-full rounded-2xl border border-holly-200 bg-holly-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400 disabled:opacity-50"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl px-4 py-2 border border-holly-200 text-holly-700 bg-white">
              Cancel
            </button>
            <button type="submit" disabled={disabled} className="rounded-2xl px-4 py-2 bg-holly-600 text-white font-semibold disabled:opacity-50">
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputModal;
