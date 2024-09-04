"use client";

import React, { useState } from "react";
import { EstimateItem } from "@/app/types";
import { Button, Modal } from "flowbite-react";
import { FieldValues, useForm } from "react-hook-form";
import { NewEstimateItemForm } from "./new_estimate_item_form/new_estimate_item_form";
import { useStepContext } from "./create_bid_step_context";
import { useEstimateItems } from "./useEstimateItems";

interface EstimateItemsFormFields {
  estimateItems: EstimateItem[];
}

export const EstimateItemsForm = () => {
  const [openModal, setOpenModal] = useState(false);
  const { handleSubmit } = useForm<EstimateItemsFormFields>();
  const { bid, setStep } = useStepContext();

  const onSubmit = (values: FieldValues) => {
    console.log('before submitting estimate items form', bid);
    setStep('timeline', bid ?? {});
    console.log('after submitting estimate items form', bid);
  };

  const { projectCost, rows } = useEstimateItems(bid ?? {});

  return (
    <>
      <div className="text-green-600">
        Project Cost: ${projectCost}
      </div>
      {rows}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col">
          <div className="self-center m-2">
            <Button onClick={() => setOpenModal(true)}>+ New Estimate Item</Button>
          </div>
          <div className="flex flex-row space-x-2">
            <Button onClick={() => setStep('details', bid ?? {})}>Back: Bid Details</Button>
            <Button type="submit">Next: Estimate Timeline</Button>
          </div>
        </div>
      </form>
      <Modal
        show={openModal}
        size="xl"
        popup
        onClose={() => setOpenModal(false)}
      >
        <Modal.Header>New Estimate Item</Modal.Header>
        <Modal.Body>
          <NewEstimateItemForm onClose={() => setOpenModal(false)} />
        </Modal.Body>
      </Modal>
    </>
  );
};
