import { describe, expect, it } from "vitest";

import { ownerFilterName } from "@/components/trades/history-filter-config";

describe("owner data", () => {
  it("Given an owner loaded from the backend, When its filter is displayed, Then the database name is used", () => {
    const owners = [{ id: 4, name: "새 소유주" }];

    const label = ownerFilterName(owners, "4");

    expect(label).toBe("새 소유주");
  });
});
