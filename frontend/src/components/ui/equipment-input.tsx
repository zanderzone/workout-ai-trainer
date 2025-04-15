import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

export interface EquipmentInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
}

export function EquipmentInput({ value, onChange, placeholder = 'Add equipment...', error }: EquipmentInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newValue = inputValue.trim();
      if (!value.includes(newValue)) {
        onChange([...value, newValue]);
      }
      setInputValue('');
    }
  };

  const removeEquipment = (equipmentToRemove: string) => {
    onChange(value.filter(item => item !== equipmentToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => removeEquipment(item)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 rounded-md border ${
            error ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
        />
        <button
          type="button"
          onClick={() => {
            if (inputValue.trim()) {
              onChange([...value, inputValue.trim()]);
              setInputValue('');
            }
          }}
          className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Add
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 