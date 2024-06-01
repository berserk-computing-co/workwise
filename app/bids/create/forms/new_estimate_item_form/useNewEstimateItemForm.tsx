import { SparklesIcon } from "@heroicons/react/16/solid";
import { Button, Dropdown, Label, TextInput, Tooltip } from "flowbite-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface EstimateItemForm {
  name: string;
  itemType: string;
  totalCost: number;
  quantity: number;
  pricePerUnit: number;
}

interface MaterialForm {
  pricePerUnit: number;
  quantity: number;
}

interface LaborForm {
  laborHours?: number;
  pricePerHour?: number;
  flatFee: boolean;
}

interface NewEstimateFormFields {
  item: EstimateItemForm;
  material: MaterialForm;
  labor: LaborForm;
}
export const useNewEstimateItemForm = (itemType: 'material' | 'labor' | 'admin' | undefined) => {
  const {
    handleSubmit,
    register,
    setValue,
    formState,
    watch,
  } = useForm<NewEstimateFormFields>();
  useEffect(() => {
    register('item');
    register('item.name', { required: true });
    register('item.totalCost', { required: true })
    register('material', { required: itemType === 'material' });
    register('labor');
  }, [register]);

  const materialForm = (
    <div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="name" value="Material" />
        </div>
        <div className="flex items-center">
          <div>
            <TextInput
              onChange={(e) => setValue('item.name', e.target.value)}
              id="name"
              placeholder="plywood"
              required
            />
          </div>
          <div>
            <Tooltip content="Fill with AI">
              <Button>
                <SparklesIcon className="size-5 text-lightblue-500" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="quantity" value="Quantity" />
        </div>
        <TextInput
          type="number"
          onChange={(e) => {
            const newQuantity = parseInt(e.target.value);
            setValue('item.quantity', newQuantity);
            setValue('material.quantity', newQuantity);
            setValue('item.totalCost', newQuantity * watch('material.pricePerUnit'))
          }}
          id="quantity"
          placeholder="quantity"
          required
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="price" value="Price" />
        </div>
        <TextInput
          onChange={(e) => {
            const newPricePerUnit = parseFloat(e.target.value);
            setValue('material.pricePerUnit', newPricePerUnit);
            setValue('item.pricePerUnit', newPricePerUnit);
            setValue('item.totalCost', newPricePerUnit * watch('material.quantity'))
          }}
          type="float"
          id="price"
          placeholder="price"
          required
        />
      </div>
    </div>
  );

  const laborForm = (
    <div>
      <div>
        <Dropdown id="laborCategory" label="Labor Category"></Dropdown>
      </div>
    </div>
  );

  return {
    materialForm,
    laborForm,
    handleSubmit,
    formState
  };
};