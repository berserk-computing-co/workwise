"use client";

import React, {useEffect, useState} from "react";
import { Button, FileInput, Label, Textarea, TextInput } from "flowbite-react";
import { useStepContext } from "./create_bid_step_context";
import { FieldValues, useForm } from "react-hook-form";
import { useNewBidContext } from "./new_bid_context";
import {AddressAutocomplete} from "@/app/(site)/bids/create/forms/address_autocomplete_form";
import {Address} from "@/app/types";

interface DetailsFormFields {
  bidTitle: string;
  bidDescription: string;
  address: Address
  streetSuffix: string
}

export const DetailsForm = () => {
  const { setStep } = useStepContext();
  const { bid } = useNewBidContext();
  const { handleSubmit, register, setValue } = useForm<DetailsFormFields>();
  const [ address, setAddress ] = useState<Partial<Address>>()
  useEffect(() => {
    register("bidTitle", { required: true });
    register("bidDescription", { required: true });
    register("address", { required: true });
    register('streetSuffix');
  }, [register]);

  const onSubmit = (values: FieldValues) => {
    setStep('estimate-items', {
      ...bid,
      name: values.bidTitle,
      description: values.bidDescription,
      address: {
        ...address,
        streetSuffix: values.streetSuffix
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label className="block text-gray-700 dark:text-slate-200 text-sm font-bold">
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
        <AddressAutocomplete
          setValue={(address) => {
            setAddress(address);
            setValue("address", address as Address);
          }}
        />
      </div>
      <div>
        <Label>Unit Number</Label>
        <TextInput
          onChange={(e) => setValue("streetSuffix", e.target?.value)}
          placeholder="Unit Number"
        />
      </div>
      <div>
        <Label>Plans</Label>
        <FileInput />
      </div>

      <Button type="submit">Next</Button>
    </form>
  );
};
