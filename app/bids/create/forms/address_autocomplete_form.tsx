import React, { useState, useEffect } from 'react';
import GooglePlacesAutocomplete, { geocodeByPlaceId } from 'react-google-places-autocomplete';
import { Address } from "@/app/types";

interface AddressAutocompleteProps {
  setValue: (address: Partial<Address>) => void;
  defaultAddress?: Partial<Address>;
}

export const AddressAutocomplete = ({ setValue, defaultAddress }: AddressAutocompleteProps) => {
  const [selectedOption, setSelectedOption] = useState<any>(null);

  useEffect(() => {
    if (defaultAddress && defaultAddress.fullAddress) {
      setSelectedOption({
        label: defaultAddress.fullAddress,
        value: defaultAddress.fullAddress,
      });
    }
  }, [defaultAddress]);

  const handleSelectAddress = async (place) => {
    const geocode = await geocodeByPlaceId(place.value.place_id);
    const addressComponents = geocode[0]?.address_components;
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zip = '';

    if (addressComponents) {
      addressComponents.forEach((component) => {
        const types = component.types;
        const value = component.long_name;
        if (types.includes('street_number')) {
          streetNumber = value;
        } else if (types.includes('route')) {
          route = value;
        } else if (types.includes('locality')) {
          city = value;
        } else if (types.includes('administrative_area_level_1')) {
          state = value;
        } else if (types.includes('postal_code')) {
          zip = value;
        }
      });

      const newStreet = `${streetNumber} ${route}`;
      setSelectedOption({
        label: newStreet,
        value: place.value,
      });

      setValue({
        street: newStreet,
        city,
        state,
        zip,
      });
    }
  };

  return (
    <div>
      <GooglePlacesAutocomplete
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        selectProps={{
          value: selectedOption, // The selected address
          onChange: handleSelectAddress, // Handles address selection
          placeholder: 'Enter job location',
          noOptionsMessage: () => 'No options', // Show this if no results
          loadingMessage: () => 'Loading...', // Show when results are being fetched
          styles: {
            control: (provided, state) => ({
              ...provided,
              borderColor: state.isFocused ? 'blue' : 'lightgrey',
              fontSize: '0.875rem',
              borderWidth: '1px',
              boxShadow: 'none',
              '&:hover': {
                borderColor: 'blue',
              },
            }),
            input: (provided) => ({
              ...provided,
              color: 'black',
              fontSize: '0.875rem', // Apply text-sm size (14px)
              border: 'none',
              boxShadow: 'none',
              outline: 'none',
            }),
            menu: (provided) => ({
              ...provided,
              backgroundColor: '#fff',
              borderRadius: '4px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected ? '#f0f0f0' : '#fff',
              color: 'black',
              padding: '10px',
              '&:hover': {
                backgroundColor: '#f7f7f7',
              },
            }),
            multiValue: (provided) => ({
              ...provided,
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              padding: '5px',
            }),
            multiValueLabel: (provided) => ({
              ...provided,
              color: '#333',
            }),
            multiValueRemove: (provided) => ({
              ...provided,
              color: '#555',
              '&:hover': {
                backgroundColor: 'red',
                color: 'white',
              },
            }),
            dropdownIndicator: (provided) => ({
              ...provided,
              color: 'blue',
              '&:hover': {
                color: 'darkblue',
              },
            }),
            indicatorSeparator: () => ({
              display: 'none',
            }),
          },
        }}
        autocompletionRequest={{
          componentRestrictions: {
            country: ['us'], // Restrict to US addresses
          },
          types: ['address'], // Only show address results
        }}
        debounce={300} // Add a debounce to reduce API calls
        minLengthAutocomplete={3} // Minimum number of characters before suggestions show
      />
    </div>
  );
};
