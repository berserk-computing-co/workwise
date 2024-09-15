import { Button, Datepicker, Label } from "flowbite-react";
import { FieldValues, useForm } from "react-hook-form";
import { useCallback } from "react";
import { useStepContext } from "./create_bid_step_context";

interface TimelineFormProps {
  onComplete: () => void;
}

export const TimelineForm = ({ onComplete }: TimelineFormProps) => {
  const { handleSubmit } = useForm();
  const { bid } = useStepContext();
  const onSubmit = useCallback(async (values: FieldValues) => {

    console.log('SENDING BID', bid)
    fetch("/api/workwise/bids", {
      method: "POST",
      body: JSON.stringify(bid),
    }).then(onComplete);
  }, [bid]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Datepicker />
        <Label>Bid Expiration Date</Label>
      </div>
      <Button type="submit">Create Bid</Button>
    </form>
  );
};
