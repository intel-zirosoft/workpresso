export type TextTransformResult = {
  text: string;
  selectionStart?: number;
  selectionEnd?: number;
};

export type TextChange = {
  nextValue: string;
  selectionStart: number;
  selectionEnd: number;
};

export type MarkdownShortcutAction =
  | "undo"
  | "redo"
  | "bold"
  | "italic"
  | "link"
  | "heading-increase"
  | "heading-decrease";

type HeadingDirection = "increase" | "decrease";

type LineSelection = {
  lineStart: number;
  lineEnd: number;
  selectedText: string;
};

function replaceTextRange(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  replacement: string,
  nextSelectionStart = selectionStart + replacement.length,
  nextSelectionEnd = nextSelectionStart,
): TextChange {
  return {
    nextValue:
      value.slice(0, selectionStart) + replacement + value.slice(selectionEnd),
    selectionStart: nextSelectionStart,
    selectionEnd: nextSelectionEnd,
  };
}

export function applyLinePrefix(text: string, prefix: string) {
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

export function getLineSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): LineSelection {
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEndIndex = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  return {
    lineStart,
    lineEnd,
    selectedText: value.slice(lineStart, lineEnd),
  };
}

function removeIndentPrefix(line: string, indentSize = 2) {
  if (line.startsWith("\t")) {
    return {
      text: line.slice(1),
      removed: 1,
    };
  }

  let removed = 0;

  while (removed < indentSize && line[removed] === " ") {
    removed += 1;
  }

  return {
    text: line.slice(removed),
    removed,
  };
}

function adjustHeadingLine(line: string, direction: HeadingDirection) {
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  const currentPrefixLength = match ? match[1].length + 1 : 0;

  if (direction === "increase") {
    if (!match) {
      return {
        text: `# ${line}`,
        prefixDelta: 2,
      };
    }

    const nextLevel = Math.min(match[1].length + 1, 6);
    const nextPrefixLength = nextLevel + 1;

    return {
      text: `${"#".repeat(nextLevel)} ${match[2]}`,
      prefixDelta: nextPrefixLength - currentPrefixLength,
    };
  }

  if (!match) {
    return {
      text: line,
      prefixDelta: 0,
    };
  }

  const nextLevel = match[1].length - 1;
  const nextPrefixLength = nextLevel <= 0 ? 0 : nextLevel + 1;

  return {
    text: nextLevel <= 0 ? match[2] : `${"#".repeat(nextLevel)} ${match[2]}`,
    prefixDelta: nextPrefixLength - currentPrefixLength,
  };
}

export function replaceSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  transform: (selectedText: string) => TextTransformResult,
): TextChange {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const result = transform(selectedText);

  return replaceTextRange(
    value,
    selectionStart,
    selectionEnd,
    result.text,
    result.selectionStart !== undefined
      ? selectionStart + result.selectionStart
      : selectionStart + result.text.length,
    result.selectionEnd !== undefined
      ? selectionStart + result.selectionEnd
      : selectionStart + result.text.length,
  );
}

export function resolveMarkdownShortcutAction(params: {
  key: string;
  code?: string;
  isMeta: boolean;
  shiftKey: boolean;
}): MarkdownShortcutAction | null {
  if (!params.isMeta) {
    return null;
  }

  switch (params.code) {
    case "KeyZ":
      return params.shiftKey ? "redo" : "undo";
    case "KeyY":
      return "redo";
    case "KeyB":
      return "bold";
    case "KeyI":
      return "italic";
    case "KeyK":
      return "link";
    case "BracketRight":
      return "heading-increase";
    case "BracketLeft":
      return "heading-decrease";
    default:
      break;
  }

  const normalizedKey = params.key.toLowerCase();

  switch (normalizedKey) {
    case "z":
      return params.shiftKey ? "redo" : "undo";
    case "y":
      return "redo";
    case "b":
      return "bold";
    case "i":
      return "italic";
    case "k":
      return "link";
    case "]":
      return "heading-increase";
    case "[":
      return "heading-decrease";
    default:
      return null;
  }
}

export function indentSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix = "  ",
): TextChange {
  const { lineStart, lineEnd, selectedText } = getLineSelection(
    value,
    selectionStart,
    selectionEnd,
  );
  const indentedText = applyLinePrefix(selectedText, prefix);

  if (selectionStart === selectionEnd) {
    const nextCaret = selectionStart + prefix.length;

    return replaceTextRange(
      value,
      lineStart,
      lineEnd,
      indentedText,
      nextCaret,
      nextCaret,
    );
  }

  if (!selectedText.includes("\n")) {
    return replaceTextRange(
      value,
      lineStart,
      lineEnd,
      indentedText,
      selectionStart + prefix.length,
      selectionEnd + prefix.length,
    );
  }

  return replaceTextRange(
    value,
    lineStart,
    lineEnd,
    indentedText,
    lineStart,
    lineStart + indentedText.length,
  );
}

export function outdentSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  indentSize = 2,
): TextChange {
  const { lineStart, lineEnd, selectedText } = getLineSelection(
    value,
    selectionStart,
    selectionEnd,
  );
  const lines = selectedText.split("\n");
  const adjustedLines = lines.map((line) =>
    removeIndentPrefix(line, indentSize),
  );
  const adjustedText = adjustedLines.map((line) => line.text).join("\n");
  const firstRemoved = adjustedLines[0]?.removed ?? 0;

  if (selectionStart === selectionEnd) {
    const nextCaret = Math.max(lineStart, selectionStart - firstRemoved);

    return replaceTextRange(
      value,
      lineStart,
      lineEnd,
      adjustedText,
      nextCaret,
      nextCaret,
    );
  }

  if (!selectedText.includes("\n")) {
    const nextSelectionStart = Math.max(
      lineStart,
      selectionStart - firstRemoved,
    );
    const nextSelectionEnd = Math.max(
      nextSelectionStart,
      selectionEnd - firstRemoved,
    );

    return replaceTextRange(
      value,
      lineStart,
      lineEnd,
      adjustedText,
      nextSelectionStart,
      nextSelectionEnd,
    );
  }

  return replaceTextRange(
    value,
    lineStart,
    lineEnd,
    adjustedText,
    lineStart,
    lineStart + adjustedText.length,
  );
}

export function adjustHeadingSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  direction: HeadingDirection,
): TextChange {
  const { lineStart, lineEnd, selectedText } = getLineSelection(
    value,
    selectionStart,
    selectionEnd,
  );

  if (!selectedText.includes("\n")) {
    const adjustedLine = adjustHeadingLine(selectedText, direction);
    const nextSelectionStart = Math.max(
      lineStart,
      selectionStart + adjustedLine.prefixDelta,
    );
    const nextSelectionEnd = Math.max(
      nextSelectionStart,
      selectionEnd + adjustedLine.prefixDelta,
    );

    return replaceTextRange(
      value,
      lineStart,
      lineEnd,
      adjustedLine.text,
      nextSelectionStart,
      nextSelectionEnd,
    );
  }

  const adjustedText = selectedText
    .split("\n")
    .map((line) => adjustHeadingLine(line, direction).text)
    .join("\n");

  return replaceTextRange(
    value,
    lineStart,
    lineEnd,
    adjustedText,
    lineStart,
    lineStart + adjustedText.length,
  );
}

export function continueMarkdownBlockOnEnter(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): TextChange | null {
  if (selectionStart !== selectionEnd) {
    return null;
  }

  const { lineStart, lineEnd } = getLineSelection(
    value,
    selectionStart,
    selectionEnd,
  );

  if (selectionStart !== lineEnd) {
    return null;
  }

  const line = value.slice(lineStart, lineEnd);

  if (!line) {
    return null;
  }

  const taskMatch = line.match(/^(\s*)([-*+])\s+\[([ xX])\]\s*(.*)$/);

  if (taskMatch) {
    const [, indentation, bullet, checked, content] = taskMatch;

    if (content.trim().length === 0) {
      return replaceTextRange(
        value,
        lineStart,
        selectionEnd,
        "\n",
        lineStart + 1,
        lineStart + 1,
      );
    }

    return replaceTextRange(
      value,
      selectionStart,
      selectionEnd,
      `\n${indentation}${bullet} [${checked}] `,
    );
  }

  const unorderedMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);

  if (unorderedMatch) {
    const [, indentation, bullet, content] = unorderedMatch;

    if (content.trim().length === 0) {
      return replaceTextRange(
        value,
        lineStart,
        selectionEnd,
        "\n",
        lineStart + 1,
        lineStart + 1,
      );
    }

    return replaceTextRange(
      value,
      selectionStart,
      selectionEnd,
      `\n${indentation}${bullet} `,
    );
  }

  const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

  if (orderedMatch) {
    const [, indentation, rawNumber, content] = orderedMatch;

    if (content.trim().length === 0) {
      return replaceTextRange(
        value,
        lineStart,
        selectionEnd,
        "\n",
        lineStart + 1,
        lineStart + 1,
      );
    }

    return replaceTextRange(
      value,
      selectionStart,
      selectionEnd,
      `\n${indentation}${Number(rawNumber) + 1}. `,
    );
  }

  const quoteMatch = line.match(/^(\s*)>\s?(.*)$/);

  if (quoteMatch) {
    const [, indentation, content] = quoteMatch;

    if (content.trim().length === 0) {
      return replaceTextRange(
        value,
        lineStart,
        selectionEnd,
        "\n",
        lineStart + 1,
        lineStart + 1,
      );
    }

    return replaceTextRange(
      value,
      selectionStart,
      selectionEnd,
      `\n${indentation}> `,
    );
  }

  const indentOnlyMatch = line.match(/^(\s+)$/);

  if (indentOnlyMatch) {
    return replaceTextRange(
      value,
      lineStart,
      selectionEnd,
      "\n",
      lineStart + 1,
      lineStart + 1,
    );
  }

  const indentationMatch = line.match(/^(\s+)\S.*$/);

  if (indentationMatch) {
    return replaceTextRange(
      value,
      selectionStart,
      selectionEnd,
      `\n${indentationMatch[1]}`,
    );
  }

  return null;
}
