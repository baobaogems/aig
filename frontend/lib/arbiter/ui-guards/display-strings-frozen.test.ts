import { describe, test, expect } from "vitest";
import { timeLeft, stripLabel, STATE_LABEL } from "../bounty-display";

describe("display-strings-frozen", () => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  test("timeLeft trả đúng chuỗi tiếng Việt", () => {
    const now = 0;
    // còn 3 ngày
    expect(timeLeft(new Date(3 * ONE_DAY).toISOString(), now)).toBe("3 days left");
    // đã quá hạn
    expect(timeLeft(new Date(-1000).toISOString(), now)).toBe("expired");
  });

  test("stripLabel trả đúng chuỗi tiếng Việt", () => {
    const now = 0;
    const future = new Date(ONE_DAY).toISOString();
    
    // đang mở
    expect(stripLabel("unclaimed", "OPEN", future, now)).toContain("left");
    
    // terminal
    expect(stripLabel("closed", "RELEASED", future, now)).toBe("released to worker");
    expect(stripLabel("closed", "REFUNDED", future, now)).toBe("refunded to poster");
    expect(stripLabel("closed", "REFUSED", future, now)).toBe("arbiter refused to grade");
    expect(stripLabel("closed", "JUDGED", future, now)).toBe("judged — pending poster decision");
    expect(stripLabel("closed", "SOMETHING_ELSE", future, now)).toBe("ended");
  });
  
  test("STATE_LABEL giữ nguyên", () => {
    expect(STATE_LABEL["unclaimed"]).toBe("Unclaimed");
    expect(STATE_LABEL["in-progress"]).toBe("In progress");
    expect(STATE_LABEL["submitted"]).toBe("Submitted · waiting for grading");
    expect(STATE_LABEL["expired"]).toBe("Expired");
    expect(STATE_LABEL["closed"]).toBe("Closed");
  });
});
