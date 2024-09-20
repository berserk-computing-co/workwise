import React from 'react';
import { Button, Label, TextInput, Tooltip } from 'flowbite-react';
import { FieldValues, useForm } from 'react-hook-form';

export const AdminForm = () => {
  const { register, watch, setValue, handleSubmit } = useForm();

  const saveAdminForm = (values: FieldValues) => {
    console.log('Saving admin form', values);
  };

  return (
    <form onSubmit={handleSubmit(saveAdminForm)}>
      <div className="h-min pb-2">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="adminFee" value="Admin Fee" />
          </div>
          <div className="flex items-center space-x-2">
            <TextInput
              id="adminFee"
              type="number"
              placeholder="0.00"
              {...register('item.totalCost', {
                required: true,
                min: 0,
                onChange: (e) => {
                  const value = parseFloat(e.target.value);
                  setValue('item.totalCost', value);
                  setValue('item.name', 'Admin Fee');
                }
              })}
            />
            <Tooltip content="Flat admin fee to be added to the bid">
              <span className="text-gray-500">ⓘ</span>
            </Tooltip>
          </div>
        </div>
        <div className="mt-4">
          <Label value="Summary" />
          <p className="text-sm text-gray-600">
            Admin Fee: ${watch('item.totalCost') || '0.00'}
          </p>
        </div>
      </div>
      <Button type='submit'>Save Admin Fee</Button>
    </form>
  );
};

export default AdminForm;