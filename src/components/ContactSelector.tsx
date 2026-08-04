import { useCallback } from 'react';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { contacts } from '../mocks/fixtures/contacts';

export default function ContactSelector() {
  const { payload, setPayload, selectedContact, setSelectedContact } =
    useTraceStore(
      useShallow((state) => ({
        payload: state.payload,
        setPayload: state.setPayload,
        selectedContact: state.selectedContact,
        setSelectedContact: state.setSelectedContact,
      }))
    );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const email = e.target.value;
      if (!email) {
        setSelectedContact(null);
        return;
      }
      const contact = contacts.find((c) => c.email === email);
      if (!contact) return;

      const newPayload = { ...payload };
      Object.entries(contact).forEach(([key, value]) => {
        newPayload[`contact.${key}`] = value;
      });
      setPayload(newPayload);
      setSelectedContact(contact);
    },
    [payload, setPayload, setSelectedContact]
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-secondary">Contact</label>
      <select
        value={(selectedContact?.email as string) ?? ''}
        onChange={handleChange}
        className="bg-card text-white border border-border rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <option value="">Select a test contact...</option>
        {contacts.map((c) => (
          <option key={c.email} value={c.email}>
            {c.first_name} {c.last_name} ({c.email})
          </option>
        ))}
      </select>
    </div>
  );
}
