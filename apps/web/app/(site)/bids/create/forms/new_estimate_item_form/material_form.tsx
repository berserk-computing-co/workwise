import React, { useEffect, useState } from 'react';
import { Button, Label, Modal, TextInput, Tooltip } from 'flowbite-react';
import { SparklesIcon } from '@heroicons/react/16/solid';
import { OneBuildTable } from './one_build_table';
import { SourceItemFields } from '@/app/api/onebuild/one_build_client';
import { FieldValues, useForm } from 'react-hook-form';
import { EstimateItemFormProps, NewEstimateFormFields } from './types';

export const MaterialForm = ({ onSubmit }: EstimateItemFormProps) => {
  const {
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<NewEstimateFormFields>();

  useEffect(() => {
    register('item');
    register('item.name', { required: true });
    register('item.totalCost', { required: true })
    setValue('item.itemType', 'material');
  }, [register]);

  const [showOneBuildModal, setShowOneBuildModal] = useState(false);

  const updateTotalCost = () => {
    const quantity = watch('item.quantity') || 0;
    const pricePerUnit = watch('item.pricePerUnit') || 0;
    const totalCost = parseFloat((quantity * pricePerUnit).toFixed(2));
    setValue('item.totalCost', totalCost);
  };

  const createMaterialEstimateItem = (values: FieldValues) => {
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit(createMaterialEstimateItem)}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" value="Material" />
          <div className="flex items-center space-x-2">
            <TextInput
              id="name"
              placeholder="e.g., plywood"
              required
              {...register('item.name', { required: true })}
            />
            <Tooltip content="Fill with AI">
              <Button onClick={() => setShowOneBuildModal(true)}>
                <SparklesIcon className="size-5 text-lightblue-500" />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div>
          <Label htmlFor="quantity" value="Quantity" />
          <TextInput
            id="quantity"
            type="number"
            placeholder="0"
            required
            {...register('item.quantity', {
              required: true,
              min: 0,
              onChange: updateTotalCost
            })}
          />
        </div>
        <div>
          <Label htmlFor="pricePerUnit" value="Price Per Unit" />
          <TextInput
            id="pricePerUnit"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            {...register('item.pricePerUnit', {
              required: true,
              min: 0,
              onChange: updateTotalCost
            })}
          />
        </div>
        <div>
          <Label htmlFor="totalCost" value="Total Cost" />
          <TextInput
            id="totalCost"
            type="number"
            step="0.01"
            placeholder="0.00"
            disabled
            value={watch('item.totalCost') || ''}
          />
        </div>

        <Modal
          show={showOneBuildModal}
          popup
          size="5xl"
          onClose={() => setShowOneBuildModal(false)}
        >
          <Modal.Header>Material Options</Modal.Header>
          <Modal.Body>
            <OneBuildTable
              material={watch('item.name')}
              chooseMaterial={(chosenMaterial: SourceItemFields) => {
                setValue('item.pricePerUnit', chosenMaterial.materialRateUsdCents / 100);
                setShowOneBuildModal(false);
                updateTotalCost();
              }}
            />
          </Modal.Body>
        </Modal>
      </div>
      <Button type='submit'>Save New Material</Button>
    </form>
  );
};

export default MaterialForm;