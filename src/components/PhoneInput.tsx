import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string;
  placeholder: string;
}

const countries: Country[] = [
  // South American Countries
  { 
    code: 'AR', 
    name: 'Argentina', 
    flag: '🇦🇷', 
    dialCode: '+54',
    format: 'XXX XXX-XXXX',
    placeholder: '11 1234-5678'
  },
  { 
    code: 'BO', 
    name: 'Bolivia', 
    flag: '🇧🇴', 
    dialCode: '+591',
    format: 'XXX XXX XXX',
    placeholder: '712 123 456'
  },
  { 
    code: 'BR', 
    name: 'Brazil', 
    flag: '🇧🇷', 
    dialCode: '+55',
    format: '(XX) XXXXX-XXXX',
    placeholder: '(11) 99999-9999'
  },
  { 
    code: 'CL', 
    name: 'Chile', 
    flag: '🇨🇱', 
    dialCode: '+56',
    format: 'X XXXX XXXX',
    placeholder: '9 1234 5678'
  },
  { 
    code: 'CO', 
    name: 'Colombia', 
    flag: '🇨🇴', 
    dialCode: '+57',
    format: 'XXX XXX XXXX',
    placeholder: '300 123 4567'
  },
  { 
    code: 'EC', 
    name: 'Ecuador', 
    flag: '🇪🇨', 
    dialCode: '+593',
    format: 'XX XXX XXXX',
    placeholder: '99 123 4567'
  },
  { 
    code: 'FK', 
    name: 'Falkland Islands', 
    flag: '🇫🇰', 
    dialCode: '+500',
    format: 'XXXXX',
    placeholder: '12345'
  },
  { 
    code: 'GF', 
    name: 'French Guiana', 
    flag: '🇬🇫', 
    dialCode: '+594',
    format: 'XXX XX XX XX',
    placeholder: '123 45 67 89'
  },
  { 
    code: 'GY', 
    name: 'Guyana', 
    flag: '🇬🇾', 
    dialCode: '+592',
    format: 'XXX XXXX',
    placeholder: '123 4567'
  },
  { 
    code: 'PE', 
    name: 'Peru', 
    flag: '🇵🇪', 
    dialCode: '+51',
    format: 'XXX XXX XXX',
    placeholder: '999 123 456'
  },
  { 
    code: 'PY', 
    name: 'Paraguay', 
    flag: '🇵🇾', 
    dialCode: '+595',
    format: 'XXX XXX XXX',
    placeholder: '981 123 456'
  },
  { 
    code: 'SR', 
    name: 'Suriname', 
    flag: '🇸🇷', 
    dialCode: '+597',
    format: 'XXX XXXX',
    placeholder: '123 4567'
  },
  { 
    code: 'UY', 
    name: 'Uruguay', 
    flag: '🇺🇾', 
    dialCode: '+598',
    format: 'XXXX XXXX',
    placeholder: '9123 4567'
  },
  { 
    code: 'VE', 
    name: 'Venezuela', 
    flag: '🇻🇪', 
    dialCode: '+58',
    format: 'XXX XXX XXXX',
    placeholder: '212 123 4567'
  },
  
  // North American Countries
  { 
    code: 'US', 
    name: 'United States', 
    flag: '🇺🇸', 
    dialCode: '+1',
    format: '(XXX) XXX-XXXX',
    placeholder: '(555) 123-4567'
  },
  { 
    code: 'CA', 
    name: 'Canada', 
    flag: '🇨🇦', 
    dialCode: '+1',
    format: '(XXX) XXX-XXXX',
    placeholder: '(555) 123-4567'
  },
  { 
    code: 'MX', 
    name: 'Mexico', 
    flag: '🇲🇽', 
    dialCode: '+52',
    format: 'XXX XXX XXXX',
    placeholder: '55 1234 5678'
  },
  
  // European Countries
  { 
    code: 'ES', 
    name: 'Spain', 
    flag: '🇪🇸', 
    dialCode: '+34',
    format: 'XXX XX XX XX',
    placeholder: '612 34 56 78'
  },
  { 
    code: 'FR', 
    name: 'France', 
    flag: '🇫🇷', 
    dialCode: '+33',
    format: 'X XX XX XX XX',
    placeholder: '1 23 45 67 89'
  },
  { 
    code: 'DE', 
    name: 'Germany', 
    flag: '🇩🇪', 
    dialCode: '+49',
    format: 'XXX XXXXXXX',
    placeholder: '30 12345678'
  },
  { 
    code: 'IT', 
    name: 'Italy', 
    flag: '🇮🇹', 
    dialCode: '+39',
    format: 'XXX XXX XXXX',
    placeholder: '320 123 4567'
  },
  { 
    code: 'GB', 
    name: 'United Kingdom', 
    flag: '🇬🇧', 
    dialCode: '+44',
    format: 'XXXX XXXXXX',
    placeholder: '7700 123456'
  },
  
  // Other Countries
  { 
    code: 'AU', 
    name: 'Australia', 
    flag: '🇦🇺', 
    dialCode: '+61',
    format: 'XXX XXX XXX',
    placeholder: '412 123 456'
  },
  { 
    code: 'JP', 
    name: 'Japan', 
    flag: '🇯🇵', 
    dialCode: '+81',
    format: 'XX-XXXX-XXXX',
    placeholder: '90-1234-5678'
  },
  { 
    code: 'CN', 
    name: 'China', 
    flag: '🇨🇳', 
    dialCode: '+86',
    format: 'XXX XXXX XXXX',
    placeholder: '138 1234 5678'
  },
  { 
    code: 'IN', 
    name: 'India', 
    flag: '🇮🇳', 
    dialCode: '+91',
    format: 'XXXXX XXXXX',
    placeholder: '98765 43210'
  },
];

interface PhoneInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

// Format phone number according to country format
const formatPhoneNumber = (value: string, country: Country): string => {
  const digits = value.replace(/\D/g, '');
  const format = country.format;
  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === 'X') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += format[i];
    }
  }

  return formatted;
};

// Get placeholder based on selected country
const getPlaceholder = (country: Country): string => {
  return country.placeholder;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  className,
  disabled = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownListRef = React.useRef<HTMLDivElement | null>(null);
  const typeAheadTimerRef = React.useRef<number | undefined>(undefined);

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    
    const term = searchTerm.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().includes(term) ||
      country.dialCode.includes(term) ||
      country.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Parse the current value to extract country and phone number
  React.useEffect(() => {
    if (value) {
      // Find country by dial code
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Enable type-ahead search (no visible input). When dropdown is open and user types,
  // accumulate keys briefly and find the first matching country, then scroll it into view.
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Allow navigation keys to work normally
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(e.key)) return;
      const key = e.key;
      if (key.length === 1 || key === 'Backspace') {
        e.preventDefault();
        let next = searchTerm;
        if (key === 'Backspace') {
          next = next.slice(0, Math.max(0, next.length - 1));
        } else {
          next = next + key;
        }
        const lowered = next.toLowerCase();
        setSearchTerm(lowered);
        // Find first match across name, dial code or ISO code
        const match = countries.find(c =>
          c.name.toLowerCase().startsWith(lowered) ||
          c.dialCode.includes(lowered) ||
          c.code.toLowerCase().startsWith(lowered)
        );
        if (match && dropdownListRef.current) {
          const el = dropdownListRef.current.querySelector(`#country-${match.code}`) as HTMLElement | null;
          el?.scrollIntoView({ block: 'nearest' });
        }
        if (typeAheadTimerRef.current) window.clearTimeout(typeAheadTimerRef.current);
        typeAheadTimerRef.current = window.setTimeout(() => setSearchTerm(''), 800);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (typeAheadTimerRef.current) window.clearTimeout(typeAheadTimerRef.current);
    };
  }, [isDropdownOpen, searchTerm]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm(''); // Clear search when country is selected
    // Clear the phone number when country changes
    setPhoneNumber('');
    onChange('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow digits, spaces, hyphens, parentheses, and plus sign
    const cleaned = inputValue.replace(/[^0-9\s\-\(\)\+]/g, '');
    
    // Format the phone number according to the selected country
    const formatted = formatPhoneNumber(cleaned, selectedCountry);
    setPhoneNumber(formatted);
    
    // Send the full number with country code
    const fullNumber = selectedCountry.dialCode + ' ' + formatted;
    onChange(fullNumber);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-base font-medium text-gray-700">{label}</Label>
      <div className="flex items-center space-x-3">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className={cn(
              "flex items-center justify-between w-36 h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium",
              "hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
              error && "border-red-500 focus:ring-red-500"
            )}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-base text-gray-700 font-semibold">({selectedCountry.dialCode})</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden">
              {/* Countries List with type-ahead (no visible input). Start typing to jump. */}
              <div ref={dropdownListRef} className="max-h-80 overflow-y-auto">
                {(filteredCountries.length > 0 ? filteredCountries : countries).map((country) => (
                  <button
                    id={`country-${country.code}`}
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-900 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors duration-150"
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-gray-900">{country.name}</div>
                      <div className="text-sm text-gray-500 truncate">({country.dialCode}) {country.placeholder}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <Input
            type="tel"
            placeholder={getPlaceholder(selectedCountry)}
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={disabled}
            maxLength={20}
            className={cn(
              "h-12 text-base border-gray-300 rounded-lg",
              "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "hover:border-gray-400 transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-500 focus:ring-red-500"
            )}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 font-medium mt-1">{error}</p>
      )}
    </div>
  );
};
