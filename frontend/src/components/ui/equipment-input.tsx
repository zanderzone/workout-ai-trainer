import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface EquipmentInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function EquipmentInput({ value, onChange, placeholder = 'Add equipment...' }: EquipmentInputProps) {
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
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[42px] bg-white">
        {value.map((equipment) => (
          <span
            key={equipment}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-900"
          >
            {equipment}
            <button
              type="button"
              onClick={() => removeEquipment(equipment)}
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 placeholder:text-gray-500"
        />
      </div>
      <p className="text-sm text-gray-600">
        Press Enter to add each piece of equipment. Be specific about weights and variations.
      </p>
    </div>
  );
} 