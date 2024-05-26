import { SparklesIcon } from "@heroicons/react/16/solid";
import { Button, Dropdown, Label, TextInput, Tooltip } from "flowbite-react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";

export const NewEstimateItemForm = () => {
  const [itemType, setItemType] = useState<"material" | "labor" | "admin">();
  const materialForm = (
    <div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="name" value="Material" />
        </div>
        <div className="flex items-center">
          <div>
            <TextInput id="name" placeholder="plywood" required />
          </div>
          <div>
            <Tooltip content="Fill with AI">
              <Button>
                <SparklesIcon className="size-5 text-blue-500" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="quantity" value="Quantity" />
        </div>
        <TextInput id="quantity" placeholder="quantity" required />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="price" value="Price" />
        </div>
        <TextInput id="price" placeholder="price" required />
      </div>
    </div>
  );

  const laborForm = (
    <div>
      <div>
        <Dropdown id="laborCategory" label="Labor Category"></Dropdown>
      </div>
    </div>
  );

  const { handleSubmit } = useForm();

  const onSubmit = (values: FieldValues) => {
    console.log("Save Estimate Item to bid");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
        {itemType === "material" && materialForm}
        {itemType === "labor" && laborForm}
      </div>
      <Button disabled={!itemType} type="submit">
        Save Estimate Item
      </Button>
    </form>
  );
};
