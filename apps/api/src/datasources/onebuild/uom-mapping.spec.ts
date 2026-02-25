import { mapUnitToOneBuildUom, zipToState } from "./uom-mapping.js";

describe("mapUnitToOneBuildUom", () => {
  it("maps 'each' to 'Each'", () => {
    expect(mapUnitToOneBuildUom("each")).toBe("Each");
  });

  it("maps 'sq ft' to 'Square Feet'", () => {
    expect(mapUnitToOneBuildUom("sq ft")).toBe("Square Feet");
  });

  it("maps 'linear feet' to 'Linear Feet'", () => {
    expect(mapUnitToOneBuildUom("linear feet")).toBe("Linear Feet");
  });

  it("maps 'EACH' to 'Each' (input is lowercased before lookup)", () => {
    expect(mapUnitToOneBuildUom("EACH")).toBe("Each");
  });

  it("returns undefined for unknown units", () => {
    expect(mapUnitToOneBuildUom("unknown_unit")).toBeUndefined();
  });
});

describe("zipToState", () => {
  it("returns 'CA' for zip 90210", () => {
    expect(zipToState("90210")).toBe("CA");
  });

  it("returns 'NY' for zip 10001", () => {
    expect(zipToState("10001")).toBe("NY");
  });

  it("returns 'TX' for zip 77001", () => {
    expect(zipToState("77001")).toBe("TX");
  });

  it("returns 'PR' for zip 00501 (prefix 005)", () => {
    expect(zipToState("00501")).toBe("PR");
  });
});
