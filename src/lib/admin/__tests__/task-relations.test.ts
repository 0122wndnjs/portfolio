import { describe, expect, it } from "vitest";
import { hasRelationCycle, type TaskRelation } from "../task-relations";

const rows: TaskRelation[] = [
  { id: "a", parent_id: null, depends_on_id: null },
  { id: "b", parent_id: "a", depends_on_id: null },
  { id: "c", parent_id: "b", depends_on_id: "a" },
];

describe("task relationships", () => {
  it("rejects self references", () => {
    expect(hasRelationCycle(rows, "a", "a", "parent_id")).toBe(true);
  });
  it("rejects direct and transitive parent cycles", () => {
    expect(hasRelationCycle(rows, "a", "b", "parent_id")).toBe(true);
    expect(hasRelationCycle(rows, "a", "c", "parent_id")).toBe(true);
  });
  it("allows acyclic reassignment", () => {
    expect(hasRelationCycle(rows, "c", "a", "parent_id")).toBe(false);
  });
  it("checks dependency links independently", () => {
    expect(hasRelationCycle(rows, "a", "b", "depends_on_id")).toBe(false);
    expect(hasRelationCycle(rows, "a", "c", "depends_on_id")).toBe(true);
  });
  it("terminates when target already belongs to a cycle", () => {
    const cyclic = [...rows, { id: "x", parent_id: "y", depends_on_id: null }, { id: "y", parent_id: "x", depends_on_id: null }];
    expect(hasRelationCycle(cyclic, "a", "x", "parent_id")).toBe(true);
  });
});
