import { Checkbox, Table } from "flowbite-react"
import { useEffect, useState } from "react"
import Image from 'next/image';
import { SourceItem, SourceItemFields, uomToOneBuildUomMap } from "@/app/api/onebuild/one_build_client";

interface OneBuildTableProps {
  material: string;
  chooseMaterial: (costDetail: SourceItemFields) => void;
}

export const OneBuildTable = ({ material, chooseMaterial }: OneBuildTableProps) => {
  const [nodes, setNodes] = useState<Array<SourceItem>>([]);

  useEffect(() => {
    const fetchOneBuildData = async () => {
      await fetch(`/api/onebuild?material=${material}`)
        .then((res) => res.json())
        .then(setNodes);
    }
    fetchOneBuildData();
  }, []);


  const tableRows = nodes.map((node) => {
    const primaryUom = node.uom;
    const costDetail = node.knownUoms.find(({ uom }) => uom === primaryUom);

    if (costDetail) {
      const {
        materialRateUsdCents: materialRate,
        laborRateUsdCents: laborRate,
        calculatedUnitRateUsdCents: unitRate
      } = costDetail ?? {
        materialRateUsdCents: 0,
        laborRateUsdCents: 0,
        calculatedUnitRateUsdCents: 0
      };
      const prices = {
        pricePerItem: ((materialRate ?? laborRate) / 100).toFixed(2),
        laborCostPerItem: (laborRate / 100).toFixed(2),
        totalCostPerItem: (unitRate / 100).toFixed(2)
      }

      return (
        <Table.Row onDoubleClick={() => chooseMaterial(costDetail)}>
          <Table.Cell>{node.name}</Table.Cell>
          <Table.Cell>
            <Image
              src={node.imagesUrls[0]}
              width="100"
              height="100"
              alt="material image"
            />
          </Table.Cell>
          <Table.Cell>{prices.pricePerItem}</Table.Cell>
          <Table.Cell>{uomToOneBuildUomMap[primaryUom]}</Table.Cell>
          <Table.Cell>{prices.laborCostPerItem}</Table.Cell>
          <Table.Cell>
            <Checkbox onClick={() => {
              console.log('Include labor in estimate');
            }} />
          </Table.Cell>
        </Table.Row>
      )
    }
  });

  return (
    <Table striped hoverable className="cursor-pointer">
      <Table.Head>
        <Table.HeadCell>Product name</Table.HeadCell>
        <Table.HeadCell>Product Image</Table.HeadCell>
        <Table.HeadCell>Price Per</Table.HeadCell>
        <Table.HeadCell>Unit</Table.HeadCell>
        <Table.HeadCell>Estimate for Labor</Table.HeadCell>
        <Table.HeadCell>Include Labor?</Table.HeadCell>
      </Table.Head>
      <Table.Body>{tableRows}</Table.Body>
    </Table>
  )
}