import { Button, Label } from "flowbite-react";
import { useState } from "react";
import { useNewEstimateItemForm } from "./useNewEstimateItemForm";
import { FieldValues } from "react-hook-form";
import { EstimateItem } from "@/app/types";
import { useStepContext } from "../create_bid_step_context";

interface NewEstimateItemFormProps {
  onClose: () => void;
}

export const NewEstimateItemForm = ({ onClose }: NewEstimateItemFormProps) => {
  const [itemType, setItemType] = useState<"material" | "labor" | "admin">();
  const { laborForm, materialForm, handleSubmit, formState } = useNewEstimateItemForm(itemType);

  const { bid, setBid } = useStepContext();

  const onSubmit = (values: FieldValues) => {
    let currentEstimate = (bid?.estimates ?? [])[0];
    if (!currentEstimate) {
      currentEstimate = {
        estimateItems: []
      };
    }
    currentEstimate.estimateItems ??= [];
    const { item } = values;
    const estimateItem: EstimateItem = {
      name: item.name,
      description: item.title,
      pricePerUnit: item.pricePerUnit,
      quantity: item.quantity,
      totalCost: item.totalCost,
      estimatableType: 'Material',
      estimatableId: 1
    };
    currentEstimate.estimateItems.push(estimateItem);
    setBid({
      ...bid,
      estimates: [...(bid?.estimates ?? []), currentEstimate],
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="type" value="Item Category" />
          </div>
          <Button.Group id="type">
            <Button
              gradientDuoTone={itemType === "material" ? "cyanToBlue" : ""}
              onClick={() => setItemType("material")}
              color="gray"
            >
              Material
            </Button>
            <Button
              gradientDuoTone={itemType === "labor" ? "cyanToBlue" : ""}
              onClick={() => setItemType("labor")}
              color="gray"
            >
              Labor
            </Button>
            <Button
              gradientDuoTone={itemType === "admin" ? "cyanToBlue" : ""}
              onClick={() => setItemType("admin")}
              color="gray"
            >
              Admin
            </Button>
          </Button.Group>
        </div>
        {itemType === "material" && materialForm}
        {itemType === "labor" && laborForm}
      </div>
      <Button disabled={!itemType} type="submit">
        Save Estimate Item
      </Button>
    </form>
  );
};
