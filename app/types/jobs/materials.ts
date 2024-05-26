import { type FieldValues } from 'react-hook-form';

export interface MaterialsForm {
  materials: any[];
};

export const validMaterialsData = (data: FieldValues): data is MaterialsForm => (
  (data as MaterialsForm).materials !== undefined
);
