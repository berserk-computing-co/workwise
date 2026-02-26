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
  MBF = 'MBF',
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
  ACRE = 'ACRE',
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
  PA = 'Pail',
  PL = 'Pallet',
  CWT = 'Hundred Weight',
  SHT = 'Sheet',
  ACRE = 'Acre',
}

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

export const oneBuildUomToUomMap: { [key: string]: Uom } = Object.fromEntries(
  Object.entries(uomToOneBuildUomMap).map(([uom, oneBuildValue]) => [oneBuildValue, uom as Uom]),
);

const naturalLanguageMap: { [key: string]: string } = {
  // EA / Each
  'each': oneBuildUom.EA,
  'piece': oneBuildUom.EA,
  'pieces': oneBuildUom.EA,
  'unit': oneBuildUom.EA,
  'units': oneBuildUom.EA,
  'item': oneBuildUom.EA,
  'items': oneBuildUom.EA,
  'ea': oneBuildUom.EA,
  // LF / Linear Feet
  'lf': oneBuildUom.LF,
  'linear foot': oneBuildUom.LF,
  'linear feet': oneBuildUom.LF,
  'lineal foot': oneBuildUom.LF,
  'lineal feet': oneBuildUom.LF,
  'lin ft': oneBuildUom.LF,
  'lin. ft': oneBuildUom.LF,
  // SF / Square Feet
  'sf': oneBuildUom.SF,
  'sq ft': oneBuildUom.SF,
  'sq. ft': oneBuildUom.SF,
  'sq. ft.': oneBuildUom.SF,
  'square foot': oneBuildUom.SF,
  'square feet': oneBuildUom.SF,
  'sqft': oneBuildUom.SF,
  // SY / Square Yards
  'sy': oneBuildUom.SY,
  'sq yd': oneBuildUom.SY,
  'sq. yd': oneBuildUom.SY,
  'square yard': oneBuildUom.SY,
  'square yards': oneBuildUom.SY,
  // CY / Cubic Yards
  'cy': oneBuildUom.CY,
  'cu yd': oneBuildUom.CY,
  'cubic yard': oneBuildUom.CY,
  'cubic yards': oneBuildUom.CY,
  // CF / Cubic Feet
  'cf': oneBuildUom.CF,
  'cu ft': oneBuildUom.CF,
  'cubic foot': oneBuildUom.CF,
  'cubic feet': oneBuildUom.CF,
  // LBS / Pounds
  'lbs': oneBuildUom.LBS,
  'lb': oneBuildUom.LBS,
  'pound': oneBuildUom.LBS,
  'pounds': oneBuildUom.LBS,
  // TONS
  'ton': oneBuildUom.TONS,
  'tons': oneBuildUom.TONS,
  // GAL / Gallon
  'gal': oneBuildUom.GAL,
  'gallon': oneBuildUom.GAL,
  'gallons': oneBuildUom.GAL,
  // HR / Hours
  'hr': oneBuildUom.HR,
  'hour': oneBuildUom.HR,
  'hours': oneBuildUom.HR,
  // DY / Day
  'dy': oneBuildUom.DY,
  'day': oneBuildUom.DY,
  'days': oneBuildUom.DY,
  // MO / Month
  'mo': oneBuildUom.MO,
  'month': oneBuildUom.MO,
  'months': oneBuildUom.MO,
  // IN / Inch
  'in': oneBuildUom.IN,
  'inch': oneBuildUom.IN,
  'inches': oneBuildUom.IN,
  // YD / Yard
  'yd': oneBuildUom.YD,
  'yard': oneBuildUom.YD,
  'yards': oneBuildUom.YD,
  // BF / Board Feet
  'bf': oneBuildUom.BF,
  'board foot': oneBuildUom.BF,
  'board feet': oneBuildUom.BF,
  // BAG
  'bag': oneBuildUom.BAG,
  'bags': oneBuildUom.BAG,
  // SET
  'set': oneBuildUom.SET,
  'sets': oneBuildUom.SET,
  // SHT / Sheet
  'sht': oneBuildUom.SHT,
  'sheet': oneBuildUom.SHT,
  'sheets': oneBuildUom.SHT,
  // CS / Case
  'cs': oneBuildUom.CS,
  'case': oneBuildUom.CS,
  'cases': oneBuildUom.CS,
  // BND / Bundle
  'bnd': oneBuildUom.BND,
  'bundle': oneBuildUom.BND,
  'bundles': oneBuildUom.BND,
  // PR / Pair
  'pr': oneBuildUom.PR,
  'pair': oneBuildUom.PR,
  'pairs': oneBuildUom.PR,
  // PK / Package
  'pk': oneBuildUom.PK,
  'pkg': oneBuildUom.PK,
  'package': oneBuildUom.PK,
  'packages': oneBuildUom.PK,
  // ACRE
  'acre': oneBuildUom.ACRE,
  'acres': oneBuildUom.ACRE,
  // OPNG / Opening
  'opng': oneBuildUom.OPNG,
  'opening': oneBuildUom.OPNG,
  'openings': oneBuildUom.OPNG,
  // OZ / Ounce
  'oz': oneBuildUom.OZ,
  'ounce': oneBuildUom.OZ,
  'ounces': oneBuildUom.OZ,
  // QT / Quart
  'qt': oneBuildUom.QT,
  'quart': oneBuildUom.QT,
  'quarts': oneBuildUom.QT,
  // PT / Pint
  'pt': oneBuildUom.PT,
  'pint': oneBuildUom.PT,
  'pints': oneBuildUom.PT,
};

export function mapUnitToOneBuildUom(unit: string): string | undefined {
  const normalized = unit.trim().toLowerCase();
  return naturalLanguageMap[normalized];
}

export function zipToState(zip: string): string {
  const prefix = parseInt(zip.substring(0, 3), 10);
  if (prefix >= 0 && prefix <= 9) return 'PR';
  if (prefix >= 10 && prefix <= 27) return 'MA';
  if (prefix >= 28 && prefix <= 29) return 'RI';
  if (prefix >= 30 && prefix <= 39) return 'NH';
  if (prefix >= 40 && prefix <= 49) return 'ME';
  if (prefix >= 50 && prefix <= 59) return 'VT';
  if (prefix >= 60 && prefix <= 69) return 'CT';
  if (prefix >= 70 && prefix <= 89) return 'NJ';
  if (prefix >= 90 && prefix <= 99) return 'NJ';
  if (prefix >= 100 && prefix <= 149) return 'NY';
  if (prefix >= 150 && prefix <= 196) return 'PA';
  if (prefix >= 197 && prefix <= 199) return 'DE';
  if (prefix >= 200 && prefix <= 205) return 'DC';
  if (prefix >= 206 && prefix <= 212) return 'MD';
  if (prefix >= 214 && prefix <= 219) return 'MD';
  if (prefix >= 220 && prefix <= 246) return 'VA';
  if (prefix >= 247 && prefix <= 268) return 'WV';
  if (prefix >= 270 && prefix <= 289) return 'NC';
  if (prefix >= 290 && prefix <= 299) return 'SC';
  if (prefix >= 300 && prefix <= 319) return 'GA';
  if (prefix >= 320 && prefix <= 339) return 'FL';
  if (prefix >= 340 && prefix <= 342) return 'FL';
  if (prefix >= 344 && prefix <= 349) return 'FL';
  if (prefix >= 350 && prefix <= 369) return 'AL';
  if (prefix >= 370 && prefix <= 385) return 'TN';
  if (prefix >= 386 && prefix <= 397) return 'MS';
  if (prefix >= 398 && prefix <= 399) return 'GA';
  if (prefix >= 400 && prefix <= 427) return 'KY';
  if (prefix >= 430 && prefix <= 459) return 'OH';
  if (prefix >= 460 && prefix <= 479) return 'IN';
  if (prefix >= 480 && prefix <= 499) return 'MI';
  if (prefix >= 500 && prefix <= 528) return 'IA';
  if (prefix >= 530 && prefix <= 549) return 'WI';
  if (prefix >= 550 && prefix <= 567) return 'MN';
  if (prefix >= 570 && prefix <= 577) return 'SD';
  if (prefix >= 580 && prefix <= 588) return 'ND';
  if (prefix >= 590 && prefix <= 599) return 'MT';
  if (prefix >= 600 && prefix <= 629) return 'IL';
  if (prefix >= 630 && prefix <= 658) return 'MO';
  if (prefix >= 660 && prefix <= 679) return 'KS';
  if (prefix >= 680 && prefix <= 693) return 'NE';
  if (prefix >= 700 && prefix <= 714) return 'LA';
  if (prefix >= 716 && prefix <= 729) return 'AR';
  if (prefix >= 730 && prefix <= 749) return 'OK';
  if (prefix >= 750 && prefix <= 799) return 'TX';
  if (prefix >= 800 && prefix <= 816) return 'CO';
  if (prefix >= 820 && prefix <= 831) return 'WY';
  if (prefix >= 832 && prefix <= 838) return 'ID';
  if (prefix >= 840 && prefix <= 847) return 'UT';
  if (prefix >= 850 && prefix <= 865) return 'AZ';
  if (prefix >= 870 && prefix <= 884) return 'NM';
  if (prefix >= 889 && prefix <= 898) return 'NV';
  if (prefix >= 900 && prefix <= 961) return 'CA';
  if (prefix >= 970 && prefix <= 979) return 'OR';
  if (prefix >= 980 && prefix <= 994) return 'WA';
  if (prefix >= 995 && prefix <= 999) return 'AK';
  return 'CA';
}
