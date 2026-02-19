import { Button, Datepicker, Label } from "flowbite-react";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { useCallback, useState } from "react";
import { useStepContext } from "./create_bid_step_context";

interface TimelineFormProps {
  onComplete: () => void;
}

export const TimelineForm = ({ onComplete }: TimelineFormProps) => {
  const { handleSubmit, control } = useForm();
  const { bid } = useStepContext();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = useCallback(async (values: FieldValues) => {
    setError(undefined);
    setIsLoading(true);
    const bidWithDates = {
      ...bid,
      expiration_date: values.expirationDate,
    };
    try {
      const response = await fetch("/api/bids/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bidWithDates),
      });
      if (!response.ok) {
        setError("Failed to generate bid PDF. Please try again.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename = `bid-${(bid?.name ?? "document").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      onComplete();
    } catch {
      setError("Failed to generate bid PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [bid, onComplete]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Controller
          name="expirationDate"
          control={control}
          render={({ field }) => (
            <Datepicker onSelectedDateChanged={(date) => field.onChange(date.toISOString())} />
          )}
        />
        <Label>Bid Expiration Date</Label>
      </div>
      {error && <div className="text-red-700 dark:text-red-400 text-sm">{error}</div>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Generating PDF…" : "Create Bid"}
      </Button>
    </form>
  );
};
