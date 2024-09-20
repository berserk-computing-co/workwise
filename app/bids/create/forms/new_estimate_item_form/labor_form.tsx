import React, { useEffect } from 'react';
import { Label, TextInput, Dropdown, Checkbox, Button } from 'flowbite-react';
import { FieldValues, useForm } from 'react-hook-form';

const laborCategories = [
  "Labor",
  "SubContractor (General)",
  "Carpenter",
  "Plumber",
  "Electrician",
  "Painter",
  "HVAC Technician",
];

export const LaborForm = () => {
  const { register, watch, setValue, unregister, handleSubmit } = useForm();
  const selectedCategory = watch('labor.category');
  const isSubcontractor = selectedCategory === "SubContractor (General)";
  const useFlatFee = watch('labor.useFlatFee');

  useEffect(() => {
    if (isSubcontractor && useFlatFee) {
      unregister(['labor.quantity', 'labor.hoursPerLaborer', 'labor.ratePerHour']);
    } else {
      unregister('labor.flatFee');
    }
  }, [isSubcontractor, useFlatFee, unregister]);

  const calculateTotalCost = () => {
    if (isSubcontractor && useFlatFee) {
      return watch('labor.flatFee') || 0;
    } else {
      const quantity = watch('labor.quantity') || 0;
      const hours = watch('labor.hoursPerLaborer') || 0;
      const rate = watch('labor.ratePerHour') || 0;
      return quantity * hours * rate;
    }
  };

  useEffect(() => {
    const totalCost = calculateTotalCost();
    setValue('item.totalCost', totalCost);
    setValue('item.name', `${selectedCategory} Labor`);
  }, [watch('labor')]);

  const createLaborForm = (values: FieldValues) => {
    console.log('Create Labor Form', values);
  };

  return (
    <form onSubmit={handleSubmit(createLaborForm)}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="laborCategory" value="Labor Category" />
          <Dropdown id="laborCategory" label={selectedCategory || "Select Labor Category"}>
            {laborCategories.map((category) => (
              <Dropdown.Item key={category} onClick={() => setValue('labor.category', category)}>
                {category}
              </Dropdown.Item>
            ))}
          </Dropdown>
        </div>

        {isSubcontractor && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useFlatFee"
              {...register('labor.useFlatFee')}
            />
            <Label htmlFor="useFlatFee">Use Flat Fee</Label>
          </div>
        )}

        {isSubcontractor && useFlatFee ? (
          <div>
            <Label htmlFor="flatFee" value="Flat Fee" />
            <TextInput
              id="flatFee"
              type="number"
              placeholder="0.00"
              {...register('labor.flatFee', {
                required: true,
                min: 0,
                onChange: () => setValue('item.totalCost', calculateTotalCost())
              })}
            />
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="quantity" value="Number of Laborers" />
              <TextInput
                id="quantity"
                type="number"
                placeholder="1"
                required
                {...register('labor.quantity', {
                  required: 'Please input a number',
                  min: 1,
                  onChange: () => setValue('item.totalCost', calculateTotalCost())
                })}
              />
            </div>
            <div>
              <Label htmlFor="hoursPerLaborer" value="Hours per Laborer" />
              <TextInput
                id="hoursPerLaborer"
                type="number"
                placeholder="8"
                required
                {...register('labor.hoursPerLaborer', {
                  required: true,
                  min: 0,
                  onChange: () => setValue('item.totalCost', calculateTotalCost())
                })}
              />
            </div>
            <div>
              <Label htmlFor="ratePerHour" value="Rate per Hour" />
              <TextInput
                id="ratePerHour"
                type="number"
                placeholder="0.00"
                required
                {...register('labor.ratePerHour', {
                  required: true,
                  min: 0,
                  onChange: () => setValue('item.totalCost', calculateTotalCost())
                })}
              />
            </div>
          </>
        )}

        <div>
          <Label value="Total Labor Cost" />
          <p className="text-sm text-gray-600">
            ${watch('item.totalCost') || '0.00'}
          </p>
        </div>
      </div>
      <Button type='submit'>Save new labor item</Button>
    </form>
  );
};

export default LaborForm;