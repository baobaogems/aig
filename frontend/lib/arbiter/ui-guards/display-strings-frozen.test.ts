import { describe, test, expect } from "vitest";
import { timeLeft, stripLabel, STATE_LABEL } from "../bounty-display";

describe("display-strings-frozen", () => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  test("timeLeft trả đúng chuỗi tiếng Việt", () => {
    const now = 0;
    // còn 3 ngày
    expect(timeLeft(new Date(3 * ONE_DAY).toISOString(), now)).toBe("còn 3 ngày");
    // đã quá hạn
    expect(timeLeft(new Date(-1000).toISOString(), now)).toBe("đã quá hạn");
  });

  test("stripLabel trả đúng chuỗi tiếng Việt", () => {
    const now = 0;
    const future = new Date(ONE_DAY).toISOString();
    
    // đang mở
    expect(stripLabel("unclaimed", "OPEN", future, now)).toContain("còn");
    
    // terminal
    expect(stripLabel("closed", "RELEASED", future, now)).toBe("đã trả tiền cho người làm");
    expect(stripLabel("closed", "REFUNDED", future, now)).toBe("đã hoàn tiền cho người đăng");
    expect(stripLabel("closed", "REFUSED", future, now)).toBe("trọng tài từ chối chấm");
    expect(stripLabel("closed", "JUDGED", future, now)).toBe("đã chấm — chờ người đăng quyết");
    expect(stripLabel("closed", "SOMETHING_ELSE", future, now)).toBe("đã kết thúc");
  });
  
  test("STATE_LABEL giữ nguyên", () => {
    expect(STATE_LABEL["unclaimed"]).toBe("Chưa ai nhận");
    expect(STATE_LABEL["in-progress"]).toBe("Đang làm");
    expect(STATE_LABEL["submitted"]).toBe("Đã nộp · chờ chấm");
    expect(STATE_LABEL["expired"]).toBe("Đã quá hạn");
    expect(STATE_LABEL["closed"]).toBe("Đã xong");
  });
});
