import { describe, expect, it } from "vitest";

import {
  adjustHeadingSelection,
  continueMarkdownBlockOnEnter,
  indentSelectedLines,
  outdentSelectedLines,
  replaceSelection,
} from "@/features/pod-a/components/document-editor";

describe("document-editor", () => {
  it("keeps the caret collapsed when indenting a single line with tab", () => {
    const change = indentSelectedLines("hello", 2, 2);

    expect(change.nextValue).toBe("  hello");
    expect(change.selectionStart).toBe(4);
    expect(change.selectionEnd).toBe(4);
  });

  it("keeps the caret collapsed when changing heading depth from a shortcut", () => {
    const change = adjustHeadingSelection("hello", 2, 2, "increase");

    expect(change.nextValue).toBe("# hello");
    expect(change.selectionStart).toBe(4);
    expect(change.selectionEnd).toBe(4);
  });

  it("supports shift-tab outdent without selecting the whole line", () => {
    const change = outdentSelectedLines("  hello", 4, 4);

    expect(change.nextValue).toBe("hello");
    expect(change.selectionStart).toBe(2);
    expect(change.selectionEnd).toBe(2);
  });

  it("continues unordered lists on the next line", () => {
    const value = "- first";
    const change = continueMarkdownBlockOnEnter(
      value,
      value.length,
      value.length,
    );

    expect(change).toEqual({
      nextValue: "- first\n- ",
      selectionStart: 10,
      selectionEnd: 10,
    });
  });

  it("resets unordered lists after pressing enter on an empty list item", () => {
    const value = "- first\n- ";
    const change = continueMarkdownBlockOnEnter(
      value,
      value.length,
      value.length,
    );

    expect(change).toEqual({
      nextValue: "- first\n\n",
      selectionStart: 9,
      selectionEnd: 9,
    });
  });

  it("continues ordered lists with the next number", () => {
    const value = "1. first";
    const change = continueMarkdownBlockOnEnter(
      value,
      value.length,
      value.length,
    );

    expect(change).toEqual({
      nextValue: "1. first\n2. ",
      selectionStart: 12,
      selectionEnd: 12,
    });
  });

  it("continues indentation for plain indented lines", () => {
    const value = "  nested";
    const change = continueMarkdownBlockOnEnter(
      value,
      value.length,
      value.length,
    );

    expect(change).toEqual({
      nextValue: "  nested\n  ",
      selectionStart: 11,
      selectionEnd: 11,
    });
  });

  it("clears indentation after a second enter on a blank indented line", () => {
    const value = "  nested\n  ";
    const change = continueMarkdownBlockOnEnter(
      value,
      value.length,
      value.length,
    );

    expect(change).toEqual({
      nextValue: "  nested\n\n",
      selectionStart: 10,
      selectionEnd: 10,
    });
  });

  it("selects placeholder text for inline formatting with no active selection", () => {
    const change = replaceSelection("", 0, 0, () => ({
      text: "**굵은 텍스트**",
      selectionStart: 2,
      selectionEnd: 8,
    }));

    expect(change).toEqual({
      nextValue: "**굵은 텍스트**",
      selectionStart: 2,
      selectionEnd: 8,
    });
  });
});
