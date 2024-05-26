"use client";

import { EstimateItem } from "@/app/types";
import { Button, Modal } from "flowbite-react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { NewEstimateItemForm } from "./new_estimate_item_form";
import { useNewBidContext } from "./new_bid_context";
import { useStepContext } from "./create_bid_step_context";

interface EstimateItemsFormFields {
  estimateItems: EstimateItem[];
}

export const EstimateItemsForm = () => {
  const estimateItems: EstimateItem[] = [];
  const estimateItem = (estimate: EstimateItem) => <>{estimateItem.name}</>;
  const [openModal, setOpenModal] = useState(false);
  const { handleSubmit } = useForm<EstimateItemsFormFields>();
  const { bid, setBid } = useNewBidContext();
  const { setStep } = useStepContext();

  const onSubmit = (values: FieldValues) => {
    setBid({
      ...bid,
      estimates: [
        {
          estimateItems: values.estimateItems,
        },
      ],
    });

    setStep("timeline");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <>{estimateItems.map(estimateItem)}</>
        <Button onClick={() => setOpenModal(true)}>+ New Estimate Item</Button>
        <Button>Next: Estimate Timeline</Button>
      </form>
      <Modal
        show={openModal}
        size="xl"
        popup
        onClose={() => setOpenModal(false)}
      >
        <Modal.Header>New Estimate Item</Modal.Header>
        <Modal.Body>
          <NewEstimateItemForm />
        </Modal.Body>
      </Modal>
    </>
  );
};
