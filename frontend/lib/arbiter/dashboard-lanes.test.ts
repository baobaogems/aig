import { describe, test, expect } from "vitest";
import { getPosterLane, getWorkerLane } from "./dashboard-lanes";

describe("dashboard-lanes", () => {
  const ALL_STATUSES = ["OPEN", "SUBMITTED", "JUDGED", "RELEASED", "REFUNDED", "REFUSED"];

  test("Poster lanes", () => {
    expect(getPosterLane("JUDGED")).toBe("needs_decision");
    
    expect(getPosterLane("OPEN")).toBe("in_progress");
    expect(getPosterLane("SUBMITTED")).toBe("in_progress");
    
    expect(getPosterLane("RELEASED")).toBe("settled");
    expect(getPosterLane("REFUNDED")).toBe("settled");
    expect(getPosterLane("REFUSED")).toBe("settled");
    
    expect(getPosterLane("UNKNOWN")).toBe(null);
  });

  test("Worker lanes", () => {
    // OPEN without worker => null (it's unassigned)
    expect(getWorkerLane("OPEN", false)).toBe(null);
    // OPEN with worker => needs_submission
    expect(getWorkerLane("OPEN", true)).toBe("needs_submission");
    
    expect(getWorkerLane("SUBMITTED", true)).toBe("waiting");
    expect(getWorkerLane("JUDGED", true)).toBe("waiting");
    
    expect(getWorkerLane("RELEASED", true)).toBe("results");
    expect(getWorkerLane("REFUNDED", true)).toBe("results");
    expect(getWorkerLane("REFUSED", true)).toBe("results");
  });

  test("JUDGED appears in different active lanes depending on role", () => {
    expect(getPosterLane("JUDGED")).toBe("needs_decision");
    expect(getWorkerLane("JUDGED", true)).toBe("waiting");
  });

  test("No valid status drops out of lanes for Poster", () => {
    const lanes = ALL_STATUSES.map(s => getPosterLane(s));
    expect(lanes.every(l => l !== null)).toBe(true);
  });
  
  test("No valid status drops out of lanes for Worker, except unassigned OPEN", () => {
    const assignedLanes = ALL_STATUSES.map(s => getWorkerLane(s, true));
    expect(assignedLanes.every(l => l !== null)).toBe(true);
  });
});
