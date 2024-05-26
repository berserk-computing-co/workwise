"use client";
import { Button, Label, Textarea, TextInput } from "flowbite-react";
import { useStepContext } from "./create_bid_step_context";
import { FieldValues, useForm } from "react-hook-form";
import { useEffect } from "react";
import { useNewBidContext } from "./new_bid_context";

interface DetailsFormFields {
  bidTitle: string;
  bidDescription: string;
  bidAddress: string;
}

export const DetailsForm = () => {
  const { setStep } = useStepContext();
  const { bid, setBid } = useNewBidContext();
  const { handleSubmit, register, setValue } = useForm<DetailsFormFields>();

  useEffect(() => {
    register("bidTitle", { required: true });
    register("bidDescription", { required: true });
    register("bidAddress", { required: true });
  });

  const onSubmit = (values: FieldValues) => {
    setBid({
      ...bid,
      name: values.bidTitle,
      description: values.bidDescription,
      address: values.bidAddress,
    });
    setStep("estimate-items");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label className="block text-gray-700 text-sm font-bold">
          Bid Title
        </Label>
        <TextInput
          onChange={(e) => setValue("bidTitle", e.target?.value)}
          placeholder="Bid Title"
          required
        />
      </div>

      <div>
        <Label>Bid Description</Label>
        <Textarea
          onChange={(e) => setValue("bidDescription", e.target?.value)}
          id="description"
          placeholder="Bid Description"
          required
        />
      </div>

      <div>
        <Label>Address</Label>
        <TextInput
          id="address"
          placeholder="Address"
          required
          onChange={(e) => setValue("bidAddress", e.target?.value)}
        />
      </div>

      <Button type="submit">Next</Button>
    </form>
  );
};
