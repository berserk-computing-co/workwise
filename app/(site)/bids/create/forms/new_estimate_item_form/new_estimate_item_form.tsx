import { Button, Label } from "flowbite-react";
import { useState } from "react";
import { FieldValues } from "react-hook-form";
import { EstimateItem } from "@/app/types";
import { useStepContext } from "../create_bid_step_context";
import MaterialForm from "./material_form";
import LaborForm from "./labor_form";
import AdminForm from "./admin_form";

interface NewEstimateItemFormProps {
  onClose: () => void;
}

export const NewEstimateItemForm = ({ onClose }: NewEstimateItemFormProps) => {
  const [itemType, setItemType] = useState<"material" | "labor" | "admin">();
  const { bid, setBid } = useStepContext();

  const onSubmit = (values: FieldValues) => {
    const currentEstimate = (bid?.estimates ?? [])[0] ?? { estimateItems: [] };
    currentEstimate.estimateItems ??= [];
    const { item } = values;
    const estimateItem: EstimateItem = {
      name: item.name,
      description: item.title,
      price_per_unit: item.pricePerUnit,
      quantity: item.quantity,
      total_cost: item.totalCost,
      estimatableType: item.itemType,
      estimatableId: undefined as unknown as number,
    };
    currentEstimate.estimateItems = [...currentEstimate.estimateItems, estimateItem];
    setBid({
      ...bid,
      estimates: [currentEstimate],
    });
    onClose();
  };

  return (
    <>
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
        {itemType === "material" && <MaterialForm onSubmit={onSubmit} />}
        {itemType === "labor" && <LaborForm onSubmit={onSubmit} />}
        {itemType === 'admin' && <AdminForm onSubmit={onSubmit} />}
      </div>
    </>
  );
};
