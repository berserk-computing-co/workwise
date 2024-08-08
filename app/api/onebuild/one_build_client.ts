const GRAPHQL_ENDPOINT = 'https://gateway-external.1build.com/';
const QUERY = `
  query sources($input: SourceSearchInput!) {
  sources(input: $input) {
    nodes {
      id
      name
      county
      imagesUrls
      uom
      externalProductUrl
      knownUoms {
        uom
        materialRateUsdCents
        laborRateUsdCents
        calculatedUnitRateUsdCents
      }
    }
    
  }
}
`.replace(/\s+/g, ' ').trim();

export interface SourceQuery {
  state: string;
  zipcode: string;
  searchTerm: string
}

export interface SourceItemFields {
  uom: string;
  calculatedUnitRateUsdCents: number;
  laborRateUsdCents: number;
  materialRateUsdCents: number;
};

export interface SourceItem {
  id: string;
  name: string;
  knownUoms: SourceItemFields[]
  imagesUrls: string[];
  costDetails: CostDetails | Partial<CostDetails>;
  selectedUom?: SourceItemFields;
  uom: Uom;
}

export interface CostDetails {
  pricePerItem: string;
  laborCostPerItem: string;
  totalCostPerItem: string;
  uom: string;
}

export interface SourceItemResponse {
  data: {
    sources: {
      nodes: SourceItem[];
      pageInfo: {
        hasNextPage: boolean;
      };
      dataLocation: {
        countyName: string;
        stateName: string;
      };
      totalCount: number;
    };
  };
};

export async function fetchSourceItems(variables: SourceQuery): Promise<SourceItemResponse | null> {
  const searchFields = {
    input: { ...variables, page: { limit: 6 }, sortBy: { type: 'MATCH_SCORE' } }
  };
  const body = JSON.stringify({
    query: QUERY,
    variables: searchFields
  });

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      '1build-api-key': '1build_ext.WroWxvAO.gQyzA4gIDOsLONpzJMfGzF6o7pnnN8YQ' // Replace with your actual API key
    },
    body
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export enum Uom {
  SF = 'SF',
  EA = 'EA',
  IN = 'IN',
  LF = 'LF',
  CLF = 'CLF',
  MLF = 'MLF',
  YD = 'YD',
  CSF = 'CSF',
  MSF = 'MSF',
  SFCA = 'SFCA',
  SY = 'SY',
  CSY = 'CSY',
  BF = 'BF',
  CBF = 'CBF',
  MBF = 'MB',
  CF = 'CF',
  CCF = 'CCF',
  MCF = 'MCF',
  CY = 'CY',
  BCY = 'BCY',
  LCY = 'LCY',
  LBS = 'LBS',
  TONS = 'TONS',
  HR = 'HR',
  MH = 'MH',
  SQIN = 'SQIN',
  CUIN = 'CUIN',
  PT = 'PT',
  QT = 'QT',
  GAL = 'GAL',
  FLOZ = 'FLOZ',
  OZ = 'OZ',
  DY = 'DY',
  WY = 'WY',
  MO = 'MO',
  OPNG = 'OPNG',
  CS = 'CS',
  BND = 'BND',
  CTN = 'CTN',
  PK = 'PK',
  SET = 'SET',
  BAG = 'BAG',
  PR = 'PR',
  PA = 'PA',
  PL = 'PL',
  CWT = 'CWT',
  SHT = 'SHT',
  ACRE = 'ACRE'
}

export enum oneBuildUom {
  EA = 'Each',
  IN = 'Inch',
  LF = 'Linear Feet',
  CLF = 'Hundreds of Linear Feet',
  MLF = 'Thousands of Linear Feet',
  YD = 'Yard',
  SF = 'Square Feet',
  CSF = 'Hundreds of Square Feet',
  MSF = 'Thousands of Square Feet',
  SFCA = 'Square Feet Contact Area',
  SY = 'Square Yards',
  CSY = 'Hundreds of Square Yards',
  BF = 'Board Feet',
  CBF = 'Hundreds of Board Feet',
  MBF = 'Thousands of Board Feet',
  CF = 'Cubic Feet',
  CCF = 'Hundreds of Cubic Feet',
  MCF = 'Thousands of Cubic Feet',
  CY = 'Cubic Yards',
  BCY = 'Bank Cubic Yards',
  LCY = 'Loose Cubic Yards',
  LBS = 'Pounds',
  TONS = 'Tons',
  HR = 'Hours',
  MH = 'Man Hours',
  SQIN = 'Square Inch',
  CUIN = 'Cubic Inch',
  PT = 'Pint',
  QT = 'Quart',
  GAL = 'Gallon',
  FLOZ = 'Fluid Ounce',
  OZ = 'Ounce',
  DY = 'Day',
  WY = 'Week',
  MO = 'Month',
  OPNG = 'Opening',
  CS = 'Case',
  BND = 'Bundle',
  CTN = 'Carton',
  PK = 'Package',
  SET = 'Set',
  BAG = 'Bag',
  PR = 'Pair',
  PA = 'Package',
  PL = 'Pallet',
  CWT = 'Hundred Weight',
  SHT = 'Sheet',
  ACRE = 'Acre'
};

export const oneBuildUoms = Object.entries(oneBuildUom).map(([key, value]) => ({
  label: value, // Display full readable name
  value: key // Use abbreviation as the value
}));

export const uomToOneBuildUomMap: { [key in Uom]: oneBuildUom } = {
  [Uom.EA]: oneBuildUom.EA,
  [Uom.IN]: oneBuildUom.IN,
  [Uom.LF]: oneBuildUom.LF,
  [Uom.CLF]: oneBuildUom.CLF,
  [Uom.MLF]: oneBuildUom.MLF,
  [Uom.YD]: oneBuildUom.YD,
  [Uom.SF]: oneBuildUom.SF,
  [Uom.CSF]: oneBuildUom.CSF,
  [Uom.MSF]: oneBuildUom.MSF,
  [Uom.SFCA]: oneBuildUom.SFCA,
  [Uom.SY]: oneBuildUom.SY,
  [Uom.CSY]: oneBuildUom.CSY,
  [Uom.BF]: oneBuildUom.BF,
  [Uom.CBF]: oneBuildUom.CBF,
  [Uom.MBF]: oneBuildUom.MBF,
  [Uom.CF]: oneBuildUom.CF,
  [Uom.CCF]: oneBuildUom.CCF,
  [Uom.MCF]: oneBuildUom.MCF,
  [Uom.CY]: oneBuildUom.CY,
  [Uom.BCY]: oneBuildUom.BCY,
  [Uom.LCY]: oneBuildUom.LCY,
  [Uom.LBS]: oneBuildUom.LBS,
  [Uom.TONS]: oneBuildUom.TONS,
  [Uom.HR]: oneBuildUom.HR,
  [Uom.MH]: oneBuildUom.MH,
  [Uom.SQIN]: oneBuildUom.SQIN,
  [Uom.CUIN]: oneBuildUom.CUIN,
  [Uom.PT]: oneBuildUom.PT,
  [Uom.QT]: oneBuildUom.QT,
  [Uom.GAL]: oneBuildUom.GAL,
  [Uom.FLOZ]: oneBuildUom.FLOZ,
  [Uom.OZ]: oneBuildUom.OZ,
  [Uom.DY]: oneBuildUom.DY,
  [Uom.WY]: oneBuildUom.WY,
  [Uom.MO]: oneBuildUom.MO,
  [Uom.OPNG]: oneBuildUom.OPNG,
  [Uom.CS]: oneBuildUom.CS,
  [Uom.BND]: oneBuildUom.BND,
  [Uom.CTN]: oneBuildUom.CTN,
  [Uom.PK]: oneBuildUom.PK,
  [Uom.SET]: oneBuildUom.SET,
  [Uom.BAG]: oneBuildUom.BAG,
  [Uom.PR]: oneBuildUom.PR,
  [Uom.PA]: oneBuildUom.PA,
  [Uom.PL]: oneBuildUom.PL,
  [Uom.CWT]: oneBuildUom.CWT,
  [Uom.SHT]: oneBuildUom.SHT,
  [Uom.ACRE]: oneBuildUom.ACRE,
};