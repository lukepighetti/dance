import * as vscode from "vscode";

import { Argument, InputOr } from ".";
import { ArgumentError, Context, Direction, keypress, moveTo, Pair, pair, Positions, Selections, Shift, surroundedBy, todo } from "../api";
import { wordBoundary } from "../api/search/word";
import { SelectionBehavior } from "../state/modes";
import { CharSet } from "../utils/charset";

/**
 * Update selections based on the text surrounding them.
 */
declare module "./seek";

/**
 * Select to character (excluded).
 *
 * @keys `t` (normal)
 *
 * #### Variants
 *
 * | Title                                    | Identifier                           | Keybinding       | Command                                                                        |
 * | ---------------------------------------- | ------------------------------------ | ---------------- | ------------------------------------------------------------------------------ |
 * | Extend to character (excluded)           | `character.extend`                   | `s-t` (normal)   | `[".seek.character", {                  "shift": "extend"                  }]` |
 * | Select to character (excluded, backward) | `character.backward`                 | `a-t` (normal)   | `[".seek.character", {                                     "direction": -1 }]` |
 * | Extend to character (excluded, backward) | `character.extend.backward`          | `s-a-t` (normal) | `[".seek.character", {                  "shift": "extend", "direction": -1 }]` |
 * | Select to character (included)           | `character.included`                 | `f` (normal)     | `[".seek.character", { "include": true                                     }]` |
 * | Extend to character (included)           | `character.included.extend`          | `s-f` (normal)   | `[".seek.character", { "include": true, "shift": "extend"                  }]` |
 * | Select to character (included, backward) | `character.included.backward`        | `a-f` (normal)   | `[".seek.character", { "include": true,                    "direction": -1 }]` |
 * | Extend to character (included, backward) | `character.included.extend.backward` | `s-a-f` (normal) | `[".seek.character", { "include": true, "shift": "extend", "direction": -1 }]` |
 */
export async function character(
  _: Context,
  inputOr: InputOr<string>,

  repetitions: number,
  direction = Direction.Forward,
  shift = Shift.Select,
  include: Argument<boolean> = false,
) {
  const input = await inputOr(() => keypress(_));

  Selections.update.byIndex((_, selection, document) => {
    let position: vscode.Position | undefined = Selections.seekFrom(selection, direction);

    for (let i = 0; i < repetitions; i++) {
      position = Positions.offset(position, direction, document);

      if (position === undefined) {
        return undefined;
      }

      position = moveTo.excluded(direction, input, position, document);

      if (position === undefined) {
        return undefined;
      }
    }

    if (include) {
      position = Positions.offset(position, input.length * direction);

      if (position === undefined) {
        return undefined;
      }
    }

    return Selections.shift(selection, position, shift);
  });
}

const defaultEnclosingPatterns = [
  "\\[", "\\]",
  "\\(", "\\)",
  "\\{", "\\}",
  "/\\*", "\\*/",
  "\\bbegin\\b", "\\bend\\b",
];

/**
 * Select to next enclosing character.
 *
 * @keys `m` (normal)
 *
 * #### Variants
 *
 * | Title                                  | Identifier                  | Keybinding       | Command                                                       |
 * | -------------------------------------- | --------------------------- | ---------------- | ------------------------------------------------------------- |
 * | Extend to next enclosing character     | `enclosing.extend`          | `s-m` (normal)   | `[".seek.enclosing", { "shift": "extend"                  }]` |
 * | Select to previous enclosing character | `enclosing.backward`        | `a-m` (normal)   | `[".seek.enclosing", {                    "direction": -1 }]` |
 * | Extend to previous enclosing character | `enclosing.extend.backward` | `s-a-m` (normal) | `[".seek.enclosing", { "shift": "extend", "direction": -1 }]` |
 */
export function enclosing(
  _: Context,

  direction = Direction.Forward,
  shift = Shift.Select,
  open: Argument<boolean> = true,
  pairs: Argument<readonly string[]> = defaultEnclosingPatterns,
) {
  ArgumentError.validate(
    "pairs",
    (pairs.length & 1) === 0,
    "an even number of pairs must be given",
  );

  const selectionBehavior = _.selectionBehavior,
        compiledPairs = [] as Pair[];

  for (let i = 0; i < pairs.length; i += 2) {
    compiledPairs.push(pair(new RegExp(pairs[i], "mu"), new RegExp(pairs[i], "mu")));
  }

  // This command intentionally ignores repetitions to be consistent with
  // Kakoune.
  // It only finds one next enclosing character and drags only once to its
  // matching counterpart. Repetitions > 1 does exactly the same with rep=1,
  // even though executing the command again will jump back and forth.
  Selections.update.byIndex((_, selection, document) => {
    // First, find an enclosing char (which may be the current character).
    let currentCharacter = selection.active;

    if (selectionBehavior === SelectionBehavior.Caret) {
      if (direction === Direction.Backward && selection.isReversed) {
        // When moving backwards, the first character to consider is the
        // character to the left, not the right. However, we hackily special
        // case `|[foo]>` (> is anchor, | is active) to jump to the end in the
        // current group.
        currentCharacter = Positions.previous(currentCharacter, document) ?? currentCharacter;
      } else if (direction === Direction.Forward && !selection.isReversed && !selection.isEmpty) {
        // Similarly, we special case `<[foo]|` to jump back in the current
        // group.
        currentCharacter = Positions.previous(currentCharacter, document) ?? currentCharacter;
      }
    }

    if (selectionBehavior === SelectionBehavior.Caret && direction === Direction.Backward) {
      // When moving backwards, the first character to consider is the
      // character to the left, not the right.
      currentCharacter = Positions.previous(currentCharacter, document) ?? currentCharacter;
    }

    const enclosedRange = surroundedBy(compiledPairs, direction, currentCharacter, open, document);

    if (enclosedRange === undefined) {
      return undefined;
    }

    if (shift === Shift.Extend) {
      return new vscode.Selection(selection.anchor, enclosedRange.active);
    }

    return enclosedRange;
  });
}

/**
 * Select to next word start.
 *
 * Select the word and following whitespaces on the right of the end of each selection.
 *
 * @keys `w` (normal)
 *
 * #### Variants
 *
 * | Title                                        | Identifier                | Keybinding       | Command                                                                                  |
 * | -------------------------------------------- | ------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
 * | Extend to next word start                    | `word.extend`             | `s-w` (normal)   | `[".seek.word", {                                 "shift": "extend"                  }]` |
 * | Select to previous word start                | `word.backward`           | `b` (normal)     | `[".seek.word", {                                                    "direction": -1 }]` |
 * | Extend to previous word start                | `word.extend.backward`    | `s-b` (normal)   | `[".seek.word", {                                 "shift": "extend", "direction": -1 }]` |
 * | Select to next non-whitespace word start     | `word.ws`                 | `a-w` (normal)   | `[".seek.word", {                     "ws": true                                     }]` |
 * | Extend to next non-whitespace word start     | `word.ws.extend`          | `s-a-w` (normal) | `[".seek.word", {                     "ws": true, "shift": "extend"                  }]` |
 * | Select to previous non-whitespace word start | `word.ws.backward`        | `a-b` (normal)   | `[".seek.word", {                     "ws": true,                    "direction": -1 }]` |
 * | Extend to previous non-whitespace word start | `word.ws.extend.backward` | `s-a-b` (normal) | `[".seek.word", {                     "ws": true, "shift": "extend", "direction": -1 }]` |
 * | Select to next word end                      | `wordEnd`                 | `e` (normal)     | `[".seek.word", { "stopAtEnd": true                                                  }]` |
 * | Extend to next word end                      | `wordEnd.extend`          | `s-e` (normal)   | `[".seek.word", { "stopAtEnd": true ,             "shift": "extend"                  }]` |
 * | Select to next non-whitespace word end       | `wordEnd.ws`              | `a-e` (normal)   | `[".seek.word", { "stopAtEnd": true , "ws": true                                     }]` |
 * | Extend to next non-whitespace word end       | `wordEnd.ws.extend`       | `s-a-e` (normal) | `[".seek.word", { "stopAtEnd": true , "ws": true, "shift": "extend"                  }]` |
 */
export function word(
  _: Context,

  repetitions: number,
  stopAtEnd: Argument<boolean> = false,
  ws: Argument<boolean> = false,
  direction = Direction.Forward,
  shift = Shift.Select,
) {
  const charset = ws ? CharSet.NonBlank : CharSet.Word;

  Selections.update.byIndex((_i, selection) => {
    const anchor = selection.anchor;

    for (let i = 0; i < repetitions; i++) {
      const mapped = wordBoundary(direction, selection.active, stopAtEnd, charset, _);

      if (mapped === undefined) {
        if (direction === Direction.Backward && selection.active.line > 0) {
          // This is a special case in Kakoune and we try to mimic it
          // here.
          // Instead of overflowing, put anchor at document start and
          // active always on the first character on the second line.
          return new vscode.Selection(Positions.lineStart(0), Positions.lineStart(1));
        }

        return undefined;
      }

      selection = mapped;
    }

    if (shift === Shift.Extend) {
      return new vscode.Selection(anchor, selection.active);
    }

    return selection;
  });
}
