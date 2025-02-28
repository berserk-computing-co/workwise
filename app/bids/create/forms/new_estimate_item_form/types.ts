import type { FieldValues } from "react-hook-form";

interface EstimateItemForm {
  name: string;
  itemType: string;
  totalCost: number;
  quantity: number;
  pricePerUnit: number;
}

export interface EstimateItemFormProps {
  onSubmit: (values: FieldValues) => void
}

export interface NewEstimateFormFields {
  item: EstimateItemForm;
}
