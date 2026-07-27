import { describe, it, expect } from "vitest";
import { NAV_CONTAINER_STYLE } from "@/components/admin/AdminNav";

// Regression: the admin tab strip wraps to a second row on a narrow window,
// but the container was pinned to height:16px. The wrapped row rendered
// outside the box, the page content below overlapped it, and the tabs on that
// row could not be clicked at all ("admin -> artists is not clickable").

describe("admin nav container", () => {
  it("does not pin the height of a strip that is allowed to wrap", () => {
    expect(NAV_CONTAINER_STYLE.flexWrap).toBe("wrap");
    expect(NAV_CONTAINER_STYLE.height).toBeUndefined();
    expect(NAV_CONTAINER_STYLE.maxHeight).toBeUndefined();
    expect(NAV_CONTAINER_STYLE.overflow).toBeUndefined();
  });

  it("still reserves one full 8x16 terminal row", () => {
    expect(NAV_CONTAINER_STYLE.minHeight).toBe("16px");
    expect(NAV_CONTAINER_STYLE.lineHeight).toBe("16px");
  });

  it("keeps every vertical dimension on the 16px grid", () => {
    for (const value of [NAV_CONTAINER_STYLE.minHeight, NAV_CONTAINER_STYLE.lineHeight, NAV_CONTAINER_STYLE.marginBottom]) {
      const px = parseInt(String(value), 10);
      expect(px % 16).toBe(0);
    }
  });
});
