import { SparklesIcon } from "@heroicons/react/16/solid";
import { Button, Dropdown, Label, Modal, TextInput, Tooltip } from "flowbite-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { OneBuildTable } from "./one_build_table";
import { SourceItemFields } from "@/app/api/onebuild/one_build_client";

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

  const [showOneBuildModal, setShowOneBuildModal] = useState(false);

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
              <Button onClick={() => setShowOneBuildModal(true)}>
                <SparklesIcon className="size-5 text-lightblue-500" />
              </Button>
            </Tooltip>
            <Modal
              show={showOneBuildModal}
              popup
              size='xl'
              onClose={() => setShowOneBuildModal(false)}
            >
              <Modal.Header>
                Material Options
              </Modal.Header>
              <Modal.Body>
                <OneBuildTable
                  material={watch('item.name')}
                  chooseMaterial={(chosenMaterial: SourceItemFields) => {
                    setValue('item.pricePerUnit', chosenMaterial.materialRateUsdCents / 100);
                    setShowOneBuildModal(false);
                  }}
                />
              </Modal.Body>
            </Modal>
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
            setValue('item.totalCost', newQuantity * watch('item.pricePerUnit'))
          }}
          id="quantity"
          placeholder="quantity"
          required
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="price" value="Price Per" />
        </div>
        <TextInput
          id="price"
          onChange={(e) => {
            const newPricePerUnit = parseFloat(e.target.value);
            const newTotalcost = parseFloat((newPricePerUnit * watch('item.quantity')).toFixed(2));
            setValue('item.pricePerUnit', newPricePerUnit);
            setValue('item.totalCost', newTotalcost);
          }}
          value={watch('item.pricePerUnit')}
          type="float"
          placeholder="Price Per"
          required
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label value="Total Cost" />
        </div>
        <TextInput
          id="total-cost"
          value={watch('item.totalCost')}
          disabled
          type="float"
          placeholder="Total Cost"
          required
        />
      </div>
    </div>
  );

  const laborForm = (
    <div className="h-min pb-2">
      <div>
        <Dropdown id="laborCategory" label="Labor Category">
          <Dropdown.Item>Labor</Dropdown.Item>
          <Dropdown.Item>SubContractor (General)</Dropdown.Item>
          <Dropdown.Item>Carpenter</Dropdown.Item>
          <Dropdown.Item>Plumber</Dropdown.Item>
        </Dropdown>
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