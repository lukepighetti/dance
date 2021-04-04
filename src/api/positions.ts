import * as vscode from "vscode";
import { Context } from "./context";

/**
 * Returns the position right after the given position, or `undefined` if
 * `position` is the last position of the document.
 */
export function nextPosition(position: vscode.Position, document?: vscode.TextDocument) {
  document ??= Context.current.document;

  const line = position.line,
        character = position.character,
        textLineLen = document.lineAt(line).text.length;

  if (character < textLineLen) {
    return new vscode.Position(line, character + 1);
  }

  if (line === document.lineCount - 1) {
    return undefined;
  }

  return new vscode.Position(line + 1, 0);
}

/**
 * Returns the position right before the given position, or `undefined` if
 * `position` is the first position of the document.
 */
export function previousPosition(position: vscode.Position, document?: vscode.TextDocument) {
  const line = position.line,
        character = position.character;

  if (character > 0) {
    return new vscode.Position(line, character - 1);
  }

  if (line === 0) {
    return undefined;
  }

  return new vscode.Position(
    line - 1,
    (document ?? Context.current.document).lineAt(line - 1).text.length,
  );
}

/**
 * Returns the position at a given (possibly negative) offset from the given
 * position, or `undefined` if such a position would go out of the bounds of the
 * document.
 */
export function offsetPosition(
  position: vscode.Position,
  by: number,
  document?: vscode.TextDocument,
) {
  if (by === 0) {
    return position;
  }

  if (by === 1) {
    return nextPosition(position, document);
  }

  if (by === -1) {
    return previousPosition(position, document);
  }

  document ??= Context.current.document;

  const offset = document.offsetAt(position) + by;

  if (offset === -1) {
    return undefined;
  }

  return document.positionAt(document.offsetAt(position) + by);
}

/**
 * Operations on `vscode.Position`s.
 */
export namespace Positions {
  export const next = nextPosition,
               previous = previousPosition,
               offset = offsetPosition;

  /**
   * The (0, 0) position.
   */
  export const zero = new vscode.Position(0, 0);
}
