import React, { useEffect } from 'react';
import { Label, TextInput, Dropdown, Checkbox, Button, Radio } from 'flowbite-react';
import { FieldValues, useForm, Controller } from 'react-hook-form';
import { EstimateItemFormProps } from './types';

const laborCategories = [
  "Labor",
  "SubContractor (General)",
  "Carpenter",
  "Plumber",
  "Electrician",
  "Painter",
  "HVAC Technician",
];

interface LaborForm {
  labor: any;
  item: {
    name: string;
    totalCost: number;
  };
}

export const LaborForm = ({ onSubmit }: EstimateItemFormProps) => {
  const { register, watch, setValue, unregister, handleSubmit, control } = useForm<LaborForm>({
    defaultValues: {
      labor: {
        category: '',
        useFlatFee: false,
        rateType: 'hourly',
      } as any,
    },
  });

  const selectedCategory = watch('labor.category');
  const isSubcontractor = selectedCategory === "SubContractor (General)";
  const useFlatFee = watch('labor.useFlatFee');
  const rateType = watch('labor.rateType');

  useEffect(() => {
    if (isSubcontractor && useFlatFee) {
      unregister(['labor.quantity', 'labor.hoursPerLaborer', 'labor.ratePerHour', 'labor.flatRatePerLaborer']);
    } else if (rateType === 'hourly') {
      unregister(['labor.flatFee', 'labor.flatRatePerLaborer']);
    } else {
      unregister(['labor.flatFee', 'labor.hoursPerLaborer', 'labor.ratePerHour']);
    }
  }, [isSubcontractor, useFlatFee, rateType, unregister]);

  const calculateTotalCost = () => {
    if (isSubcontractor && useFlatFee) {
      return watch('labor.flatFee') || 0;
    } else if (rateType === 'hourly') {
      const quantity = watch('labor.quantity') || 0;
      const hours = watch('labor.hoursPerLaborer') || 0;
      const rate = watch('labor.ratePerHour') || 0;
      return quantity * hours * rate;
    } else {
      const quantity = watch('labor.quantity') || 0;
      const flatRate = watch('labor.flatRatePerLaborer') || 0;
      return quantity * flatRate;
    }
  };

  const laborValues = watch('labor');
  useEffect(() => {
    const totalCost = calculateTotalCost();
    setValue('item.totalCost', totalCost);
  }, [laborValues?.quantity, laborValues?.hoursPerLaborer, laborValues?.ratePerHour, laborValues?.flatFee, laborValues?.flatRatePerLaborer, laborValues?.useFlatFee, laborValues?.rateType]);

  const createLaborForm = (values: FieldValues) => {
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(createLaborForm)} className="space-y-4">
      <div>
        <Label htmlFor="laborCategory" value="Labor Category" />
        <Controller
          name="labor.category"
          control={control}
          rules={{ required: 'Please select a labor category' }}
          render={({ field }) => (
            <Dropdown id="laborCategory" label={field.value || "Select Labor Category"}>
              {laborCategories.map((category) => (
                <Dropdown.Item
                  key={category}
                  onClick={() => {
                    field.onChange(category)
                    setValue('item.name', category);
                  }}
                >
                  {category}
                </Dropdown.Item>
              ))}
            </Dropdown>
          )}
        />
      </div>

      {isSubcontractor && (
        <div className="flex items-center space-x-2">
          <Controller
            name="labor.useFlatFee"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="useFlatFee"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
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

          <div className="flex items-center space-x-4">
            <Controller
              name="labor.rateType"
              control={control}
              render={({ field }) => (
                <>
                  <Radio
                    id="hourlyRate"
                    value="hourly"
                    checked={field.value === 'hourly'}
                    onChange={() => field.onChange('hourly')}
                  />
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>

                  <Radio
                    id="flatRate"
                    value="flat"
                    checked={field.value === 'flat'}
                    onChange={() => field.onChange('flat')}
                  />
                  <Label htmlFor="flatRate">Flat Rate per Laborer</Label>
                </>
              )}
            />
          </div>

          {rateType === 'hourly' ? (
            <>
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
          ) : (
            <div>
              <Label htmlFor="flatRatePerLaborer" value="Flat Rate per Laborer" />
              <TextInput
                id="flatRatePerLaborer"
                type="number"
                placeholder="0.00"
                required
                {...register('labor.flatRatePerLaborer', {
                  required: true,
                  min: 0,
                  onChange: () => setValue('item.totalCost', calculateTotalCost())
                })}
              />
            </div>
          )}
        </>
      )}

      <div>
        <Label value="Total Labor Cost" />
        <p className="text-sm text-gray-600">
          ${watch('item.totalCost') || '0.00'}
        </p>
      </div>

      <Button type='submit'>Save new labor item</Button>
    </form>
  );
};

export default LaborForm;