"use client";

import { useForm } from "react-hook-form";
import { Modal, TextInput, Label } from "flowbite-react";

interface AddItemFormValues {
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
}

interface AddItemModalProps {
  projectId: string;
  sectionId: string;
  onClose: () => void;
  onSuccess: () => void;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

export function AddItemModal({
  projectId,
  sectionId,
  onClose,
  onSuccess,
  addToast,
}: AddItemModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddItemFormValues>({
    defaultValues: { quantity: "1" },
  });

  const onSubmit = async (data: AddItemFormValues) => {
    try {
      const res = await fetch(`/api/proxy/projects/${projectId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          description: data.description.trim(),
          quantity: parseFloat(data.quantity),
          unit: data.unit.trim(),
          unitCost: parseFloat(data.unitCost),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Failed to add item",
        );
      }
      addToast("success", "Item added");
      onSuccess();
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to add item",
      );
    }
  };

  return (
    <Modal show onClose={onClose} size="md">
      <Modal.Header>Add Item</Modal.Header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="item-description" value="Description" />
              <TextInput
                id="item-description"
                {...register("description", { required: "Required" })}
                color={errors.description ? "failure" : undefined}
                helperText={errors.description?.message}
                placeholder="e.g. Install 1/2-in drywall"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="item-qty" value="Quantity" />
                <TextInput
                  id="item-qty"
                  type="number"
                  {...register("quantity", {
                    required: "Required",
                    min: { value: 0.001, message: "Must be > 0" },
                  })}
                  color={errors.quantity ? "failure" : undefined}
                  helperText={errors.quantity?.message}
                  step="any"
                />
              </div>
              <div>
                <Label htmlFor="item-unit" value="Unit" />
                <TextInput
                  id="item-unit"
                  {...register("unit", { required: "Required" })}
                  color={errors.unit ? "failure" : undefined}
                  helperText={errors.unit?.message}
                  placeholder="SF, LF, EA..."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item-cost" value="Unit Cost ($)" />
              <TextInput
                id="item-cost"
                type="number"
                step="0.01"
                {...register("unitCost", {
                  required: "Required",
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
                color={errors.unitCost ? "failure" : undefined}
                helperText={errors.unitCost?.message}
                placeholder="0.00"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Adding…" : "Add Item"}
            </button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
