import { useState } from 'react';

const createDefaultState = (name = '') => ({
  name,
  favoriteColor: '',
  favoriteSnacks: '',
  hobbies: '',
  thingsLove: ['', '', ''],
  thingsNoNeed: ['', '', ''],
});

const WishModal = ({ open, onClose, onSubmit, defaultName }) => {
  const [form, setForm] = useState(() => createDefaultState(defaultName));

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateListField = (field, index, value) => {
    setForm((prev) => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      favoriteColor: form.favoriteColor,
      favoriteSnacks: form.favoriteSnacks,
      hobbies: form.hobbies,
      thingsLove: form.thingsLove.filter((item) => item.trim()),
      thingsNoNeed: form.thingsNoNeed.filter((item) => item.trim()),
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl relative">
        <button
          aria-label="Close form"
          className="absolute right-5 top-5 text-holly-500 hover:text-holly-700"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold text-holly-700 mb-6">Make a Wish ✨</h3>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-2xl border border-holly-200 bg-holly-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
              />
            </Field>
            <Field label="Favorite Color">
              <input
                type="text"
                required
                value={form.favoriteColor}
                onChange={(e) => updateField('favoriteColor', e.target.value)}
                className="w-full rounded-2xl border border-holly-200 bg-holly-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Favorite Snacks/Treats">
              <input
                type="text"
                required
                value={form.favoriteSnacks}
                onChange={(e) => updateField('favoriteSnacks', e.target.value)}
                className="w-full rounded-2xl border border-holly-200 bg-holly-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
              />
            </Field>
            <Field label="Hobbies & Interests">
              <input
                type="text"
                required
                value={form.hobbies}
                onChange={(e) => updateField('hobbies', e.target.value)}
                className="w-full rounded-2xl border border-holly-200 bg-holly-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
              />
            </Field>
          </div>

          <Field label="Things I'd Love to Receive (max 3)">
            <div className="grid gap-3 md:grid-cols-3">
              {form.thingsLove.map((item, index) => (
                <input
                  key={index}
                  type="text"
                  value={item}
                  onChange={(e) => updateListField('thingsLove', index, e.target.value)}
                  className="rounded-2xl border border-holly-200 bg-holly-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-holly-400"
                  placeholder={`Idea ${index + 1}`}
                />
              ))}
            </div>
          </Field>

          <Field label="Things I Don't Need (max 3)">
            <div className="grid gap-3 md:grid-cols-3">
              {form.thingsNoNeed.map((item, index) => (
                <input
                  key={index}
                  type="text"
                  value={item}
                  onChange={(e) => updateListField('thingsNoNeed', index, e.target.value)}
                  className="rounded-2xl border border-holly-200 bg-holly-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-holly-400"
                  placeholder={`Avoid ${index + 1}`}
                />
              ))}
            </div>
          </Field>

          <button
            type="submit"
            className="w-full rounded-2xl bg-holly-600 py-3 text-white text-lg font-semibold shadow-holly-600/40 shadow-lg hover:bg-holly-500"
          >
            Make the Wish
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block text-sm font-semibold text-holly-600">
    {label}
    <div className="mt-2">{children}</div>
  </label>
);

export default WishModal;
