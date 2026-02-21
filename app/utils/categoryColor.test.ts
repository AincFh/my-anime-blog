import { expect, test, describe } from "vitest";
import { getCategoryColor } from "./categoryColor";

describe("getCategoryColor", () => {
    test("returns predefined color for known category", () => {
        expect(getCategoryColor("技术")).toBe("from-blue-500 to-cyan-500");
    });

    test("returns default color for empty category", () => {
        expect(getCategoryColor("")).toBe("from-slate-500 to-slate-600");
        expect(getCategoryColor(null as any)).toBe("from-slate-500 to-slate-600");
    });

    test("returns consistent color for unknown category", () => {
        // Hash consistency check
        const color1 = getCategoryColor("React");
        const color2 = getCategoryColor("React");
        expect(color1).toBe(color2);

        // Check format
        expect(color1).toMatch(/^from-\w+-\d+ to-\w+-\d+$/);

        // Different inputs should ideally produce different outputs (collision possible but unlikely for small set)
        const color3 = getCategoryColor("Vue");
        // heavily dependent on hash, just checking it runs
        expect(typeof color3).toBe("string");
    });
});
