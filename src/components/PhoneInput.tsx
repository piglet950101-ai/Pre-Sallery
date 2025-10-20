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
  // South American Countries Only
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
  }
];

interface PhoneInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, country?: Country) => void;
  onFocus?: () => void;
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
  onFocus,
  error,
  className,
  disabled = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    const ve = countries.find(c => c.code === 'VE');
    return ve ?? countries[0];
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  // Enable type-ahead search and arrow key navigation. When dropdown is open and user types,
  // accumulate keys briefly and find the first matching country, then scroll it into view.
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const currentCountries = filteredCountries.length > 0 ? filteredCountries : countries;
      
      // Handle Enter key to select the currently highlighted country
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation(); // Prevent form submission
        e.stopImmediatePropagation(); // Stop all other event handlers
        if (currentCountries.length > 0 && selectedIndex >= 0 && selectedIndex < currentCountries.length) {
          handleCountrySelect(currentCountries[selectedIndex]);
        }
        return;
      }
      
      // Handle Escape key to close dropdown
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchTerm('');
        return;
      }
      
      // Handle Arrow Down key
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev + 1;
          return next >= currentCountries.length ? 0 : next;
        });
        return;
      }
      
      // Handle Arrow Up key
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev - 1;
          return next < 0 ? currentCountries.length - 1 : next;
        });
        return;
      }
      
      // Allow Tab key to work normally
      if (e.key === 'Tab') return;
      
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
        // Reset selected index when searching
        setSelectedIndex(0);
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
  }, [isDropdownOpen, searchTerm, selectedIndex, filteredCountries]);

  // Close dropdown when other form elements are focused
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const dropdownContainer = dropdownListRef.current?.parentElement;
      
      // Check if the focus is moving to an element outside the dropdown
      if (dropdownContainer && !dropdownContainer.contains(target)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    // Listen for focus events on the document
    document.addEventListener('focusin', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusOut);
    };
  }, [isDropdownOpen]);

  // Reset selectedIndex when dropdown opens and focus the dropdown
  React.useEffect(() => {
    if (isDropdownOpen) {
      setSelectedIndex(0);
      // Focus the dropdown container to ensure keyboard events work
      setTimeout(() => {
        const dropdown = dropdownListRef.current?.parentElement;
        if (dropdown) {
          dropdown.focus();
        }
      }, 0);
    }
  }, [isDropdownOpen]);

  // Scroll selected country into view when selectedIndex changes
  React.useEffect(() => {
    if (!isDropdownOpen || !dropdownListRef.current) return;
    
    const currentCountries = filteredCountries.length > 0 ? filteredCountries : countries;
    const selectedCountry = currentCountries[selectedIndex];
    
    if (selectedCountry) {
      const element = dropdownListRef.current.querySelector(`#country-${selectedCountry.code}`) as HTMLElement | null;
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isDropdownOpen, filteredCountries]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm(''); // Clear search when country is selected
    setSelectedIndex(0); // Reset selected index
    // Clear the phone number when country changes
    setPhoneNumber('');
    onChange('', selectedCountry);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSelectedIndex(0); // Reset to first item when opening
    }
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
    onChange(fullNumber, selectedCountry);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-base font-medium text-gray-700">{label}</Label>
      <div className="flex items-center space-x-3">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={handleDropdownToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleDropdownToggle();
              }
            }}
            disabled={disabled}
            className={cn(
              "flex items-center justify-between w-36 h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium",
              "hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-0 focus:border-gray-400",
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
            <div 
              className="absolute top-full left-0 z-50 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden"
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  const currentCountries = filteredCountries.length > 0 ? filteredCountries : countries;
                  if (currentCountries.length > 0 && selectedIndex >= 0 && selectedIndex < currentCountries.length) {
                    handleCountrySelect(currentCountries[selectedIndex]);
                  }
                }
              }}
            >
              {/* Countries List with type-ahead (no visible input). Start typing to jump. */}
              <div ref={dropdownListRef} className="max-h-80 overflow-y-auto">
                {(filteredCountries.length > 0 ? filteredCountries : countries).map((country, index) => {
                  const currentCountries = filteredCountries.length > 0 ? filteredCountries : countries;
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <button
                      id={`country-${country.code}`}
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCountrySelect(country);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-900 transition-colors duration-150",
                        isSelected 
                          ? "bg-blue-100 border-l-4 border-blue-500" 
                          : "hover:bg-blue-50 focus:outline-none focus:bg-blue-50"
                      )}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-gray-900">{country.name}</div>
                        <div className="text-sm text-gray-500 truncate">({country.dialCode}) {country.placeholder}</div>
                      </div>
                    </button>
                  );
                })}
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
            onFocus={onFocus}
            disabled={disabled}
            maxLength={20}
            className={cn(
              "h-12 text-base border-gray-300 rounded-lg",
              "focus:ring-0 focus:border-gray-400",
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
