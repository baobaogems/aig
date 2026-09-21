import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Orbitron font does not support Vietnamese characters.
// This test checks if any file using the Orbitron font also contains Vietnamese characters.
const VN_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

describe("orbitron-no-vietnamese", () => {
  it("no tsx files should mix Orbitron and Vietnamese text", () => {
    // readdirSync with recursive: true requires Node 20+, which is standard now
    const allFiles = readdirSync(process.cwd(), { recursive: true }) as string[];
    const files = allFiles.filter(f => f.endsWith(".tsx") && !f.includes("node_modules"));
    let failures: string[] = [];

    for (const file of files) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      // Check if it uses the display font (Orbitron)
      if (src.includes("var(--font-display)")) {
        // Find elements using the font.
        // A naive check: if the file has var(--font-display) and VN_CHARS, we report it.
        // But to be precise, we should only complain if they are close or in the same element.
        // Since we can't parse JSX easily here, let's just do a strict regex on the same line.
        const lines = src.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes("var(--font-display)") && VN_CHARS.test(line)) {
            failures.push(`${file}:${i + 1}`);
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
