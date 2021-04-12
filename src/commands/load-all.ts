import { ArgumentError, commands, Context, Direction, EditorRequiredError, Shift } from "../api";
import { Register } from "../register";
import { CommandDescriptor, Commands } from ".";

function getRegister<F extends Register.Flags>(
  _: Context.WithoutActiveEditor,
  argument: { register?: string | Register },
  defaultRegisterName: string,
  requiredFlags: F,
): Register.WithFlags<F> {
  let register = argument.register;
  const extension = _.extensionState;

  if (typeof register === "string") {
    if (register.startsWith(" ")) {
      if (!(_ instanceof Context)) {
        throw new EditorRequiredError();
      }

      register = extension.registers.forDocument(_.document).get(register.slice(1));
    } else {
      register = extension.registers.get(register);
    }
  } else if (!(register instanceof Register)) {
    register = extension.registers.get(defaultRegisterName);
  }

  register.checkFlags(requiredFlags);

  return (argument.register = register as any);
}

function getCount(_: Context.WithoutActiveEditor, argument: { count?: number }) {
  const count = +(argument.count as any);

  if (count >= 0 && Number.isInteger(count)) {
    return count;
  }

  return (argument.count = 0);
}

function getRepetitions(_: Context.WithoutActiveEditor, argument: { count?: number }) {
  const count = getCount(_, argument);

  if (count <= 0) {
    return 1;
  }

  return count;
}

function getDirection(argument: { direction?: number | string }) {
  const direction = argument.direction;

  if (direction === undefined) {
    return undefined;
  }

  if (typeof direction === "number") {
    if (direction === 1 || direction === -1) {
      return direction as Direction;
    }
  } else if (typeof direction === "string") {
    if (direction === "forward") {
      return Direction.Forward;
    }

    if (direction === "backward") {
      return Direction.Backward;
    }
  }

  throw new ArgumentError(
    '"direction" must be "forward", "backward", 1, -1, or undefined',
    "direction",
  );
}

function getShift(argument: { shift?: number | string }) {
  const shift = argument.shift;

  if (shift === undefined) {
    return undefined;
  }

  if (typeof shift === "number") {
    if (shift === 0 || shift === 1 || shift === 2) {
      return shift as Shift;
    }
  } else if (typeof shift === "string") {
    if (shift === "jump") {
      return Shift.Jump;
    }

    if (shift === "select") {
      return Shift.Select;
    }

    if (shift === "extend") {
      return Shift.Extend;
    }
  }

  throw new ArgumentError(
    '"shift" must be "jump", "select", "extend", 0, 1, 2, or undefined',
    "shift",
  );
}

function getInput(argument: { input?: any }) {
  return argument.input;
}

function getSetInput(argument: { input?: any }) {
  return (input: unknown) => argument.input = input;
}

function getInputOr(argument: { input?: any }): any {
  const defaultInput = argument.input;

  if (defaultInput != null) {
    return () => defaultInput;
  }

  return (promptDefaultInput: () => any) => {
    const result = promptDefaultInput();

    if (typeof result.then === "function") {
      return (result as Thenable<any>).then((x) => (argument.input = x));
    }

    return (argument.input = result);
  };
}

/* eslint-disable max-len */

//
// Content below this line was auto-generated by load-all.build.ts. Do not edit manually.

/**
 * Loads the "edit" module and returns its defined commands.
 */
async function loadEditModule(): Promise<CommandDescriptor[]> {
  const {
    align,
    case_swap,
    case_toLower,
    case_toUpper,
    copyIndentation,
    deindent,
    deindent_withIncomplete,
    indent,
    indent_withEmpty,
    insert,
    join,
    join_select,
    newLine_above,
    newLine_below,
    replaceCharacters,
  } = await import("./edit");

  return [
    new CommandDescriptor(
      "dance.edit.align",
      (_, argument) => _.runAsync((_) => align(_, _.selections, argument.fill)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.case.swap",
      (_) => _.runAsync((_) => case_swap(_)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.case.toLower",
      (_) => _.runAsync((_) => case_toLower(_)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.case.toUpper",
      (_) => _.runAsync((_) => case_toUpper(_)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.copyIndentation",
      (_, argument) => _.runAsync((_) => copyIndentation(_, _.document, _.selections, getCount(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.deindent",
      (_, argument) => _.runAsync((_) => deindent(_, getRepetitions(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.deindent.withIncomplete",
      (_, argument) => _.runAsync((_) => deindent_withIncomplete(_, getRepetitions(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.indent",
      (_, argument) => _.runAsync((_) => indent(_, getRepetitions(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.indent.withEmpty",
      (_, argument) => _.runAsync((_) => indent_withEmpty(_, getRepetitions(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.insert",
      (_, argument) => _.runAsync((_) => insert(_, _.selections, getRegister(_, argument, "dquote", Register.Flags.CanRead), argument.adjust, argument.handleNewLine, argument.select, argument.where)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.join",
      (_, argument) => _.runAsync((_) => join(_, argument.separator)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.join.select",
      (_, argument) => _.runAsync((_) => join_select(_, argument.separator)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.newLine.above",
      (_, argument) => _.runAsync((_) => newLine_above(_, argument.select)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.newLine.below",
      (_, argument) => _.runAsync((_) => newLine_below(_, argument.select)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.replaceCharacters",
      (_, argument) => _.runAsync((_) => replaceCharacters(_, getRepetitions(_, argument), getInputOr(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.delete",
      (_) => _.runAsync(() => commands([".edit.insert", { "register": "_" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.delete-insert",
      (_) => _.runAsync(() => commands([".edit.insert", { "register": "_" }], [".modes.set", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.newLine.above.insert",
      (_) => _.runAsync(() => commands([".edit.newLine.above", { "select": true }], [".modes.set", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.newLine.below.insert",
      (_) => _.runAsync(() => commands([".edit.newLine.below", { "select": true }], [".modes.set", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.paste.after",
      (_) => _.runAsync(() => commands([".edit.insert", { "handleNewLine": true, "where": "end" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.paste.after.select",
      (_) => _.runAsync(() => commands([".edit.insert", { "handleNewLine": true, "where": "end", "select": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.paste.before",
      (_) => _.runAsync(() => commands([".edit.insert", { "handleNewLine": true, "where": "start" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.paste.before.select",
      (_) => _.runAsync(() => commands([".edit.insert", { "handleNewLine": true, "where": "start", "select": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.selectRegister-insert",
      (_) => _.runAsync(() => commands([".selectRegister"], [".edit.insert"])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.yank-delete",
      (_) => _.runAsync(() => commands([".selections.saveText"], [".edit.insert", { "register": "_" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.yank-delete-insert",
      (_) => _.runAsync(() => commands([".selections.saveText"], [".edit.insert", { "register": "_" }], [".modes.set", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.edit.yank-replace",
      (_) => _.runAsync(() => commands([".selections.saveText"], [".edit.insert"])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "history" module and returns its defined commands.
 */
async function loadHistoryModule(): Promise<CommandDescriptor[]> {
  const {
    backward,
    forward,
    recording_play,
    recording_start,
    recording_stop,
    redo,
    repeat,
    repeat_edit,
    undo,
  } = await import("./history");

  return [
    new CommandDescriptor(
      "dance.history.backward",
      (_) => backward(),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.forward",
      (_) => forward(),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.recording.play",
      (_, argument) => recording_play(getRepetitions(_, argument), getRegister(_, argument, "arobase", Register.Flags.CanReadWriteMacros)),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.recording.start",
      (_, argument) => recording_start(getRegister(_, argument, "arobase", Register.Flags.CanReadWriteMacros)),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.recording.stop",
      (_, argument) => recording_stop(getRegister(_, argument, "arobase", Register.Flags.CanReadWriteMacros)),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.redo",
      (_) => redo(),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.repeat",
      (_, argument) => repeat(getRepetitions(_, argument), argument.include, argument.exclude),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.repeat.edit",
      (_, argument) => repeat_edit(getRepetitions(_, argument)),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.undo",
      (_) => undo(),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.history.repeat.objectSelection",
      (_) => _.runAsync(() => commands([".history.repeat", { "include": "dance.selections.object.+" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.history.repeat.selection",
      (_) => _.runAsync(() => commands([".history.repeat", { "include": "dance.selections.+" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "keybindings" module and returns its defined commands.
 */
async function loadKeybindingsModule(): Promise<CommandDescriptor[]> {
  const {
    setup,
  } = await import("./keybindings");

  return [
    new CommandDescriptor(
      "dance.keybindings.setup",
      (_, argument) => _.runAsync((_) => setup(_, getRegister(_, argument, "dquote", Register.Flags.CanWrite))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "misc" module and returns its defined commands.
 */
async function loadMiscModule(): Promise<CommandDescriptor[]> {
  const {
    cancel,
    ignore,
    openMenu,
    run,
    selectRegister,
    updateCount,
  } = await import("./misc");

  return [
    new CommandDescriptor(
      "dance.cancel",
      (_) => cancel(_.extensionState),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.ignore",
      (_) => ignore(),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.openMenu",
      (_, argument) => _.runAsync((_) => openMenu(_, getInputOr(argument), argument.menu, argument.additionalArgs)),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.run",
      (_, argument) => _.runAsync((_) => run(_, getInputOr(argument), argument.commands)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selectRegister",
      (_, argument) => _.runAsync((_) => selectRegister(_, getInputOr(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.updateCount",
      (_, argument) => _.runAsync((_) => updateCount(_, getCount(_, argument), _.extensionState, getInputOr(argument), argument.addDigits)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "modes" module and returns its defined commands.
 */
async function loadModesModule(): Promise<CommandDescriptor[]> {
  const {
    set,
    set_temporarily,
  } = await import("./modes");

  return [
    new CommandDescriptor(
      "dance.modes.set",
      (_, argument) => _.runAsync((_) => set(_, getInputOr(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.set.temporarily",
      (_, argument) => _.runAsync((_) => set_temporarily(_, getInputOr(argument), getRepetitions(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.insert.after",
      (_) => _.runAsync(() => commands([".selections.faceForward"] , [".modes.set", { "input": "insert" }], [".selections.reduce", { "where": "end"  , "handleCharacterBehavior": false }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.insert.before",
      (_) => _.runAsync(() => commands([".selections.faceBackward"], [".modes.set", { "input": "insert" }], [".selections.reduce", { "where": "start", "handleCharacterBehavior": false }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.insert.lineEnd",
      (_) => _.runAsync(() => commands([".select.lineEnd"  , { "shift": "jump" }], [".modes.set", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.insert.lineStart",
      (_) => _.runAsync(() => commands([".select.lineStart", { "shift": "jump" }], [".modes.set", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.set.insert",
      (_) => _.runAsync(() => commands([".modes.set", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.set.normal",
      (_) => _.runAsync(() => commands([".modes.set", { "input": "normal" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.set.temporarily.insert",
      (_) => _.runAsync(() => commands([".modes.set.temporarily", { "input": "insert" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.modes.set.temporarily.normal",
      (_) => _.runAsync(() => commands([".modes.set.temporarily", { "input": "normal" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "search" module and returns its defined commands.
 */
async function loadSearchModule(): Promise<CommandDescriptor[]> {
  const {
    next,
    search,
    selection,
  } = await import("./search");

  return [
    new CommandDescriptor(
      "dance.search.",
      (_, argument) => _.runAsync((_) => search(_, getRegister(_, argument, "slash", Register.Flags.CanWrite), getRepetitions(_, argument), argument.add, getDirection(argument), argument.interactive, getInput(argument), getSetInput(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.next",
      (_, argument) => _.runAsync((_) => next(_, _.document, getRegister(_, argument, "slash", Register.Flags.CanRead), getRepetitions(_, argument), argument.add, getDirection(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.selection",
      (_, argument) => selection(_.document, _.selections, getRegister(_, argument, "slash", Register.Flags.CanWrite), argument.smart),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.add",
      (_) => _.runAsync(() => commands([".search", { "add": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.backward",
      (_) => _.runAsync(() => commands([".search", { "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.backward.add",
      (_) => _.runAsync(() => commands([".search", { "direction": -1, "add": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.next.add",
      (_) => _.runAsync(() => commands([".search.next", { "add": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.previous",
      (_) => _.runAsync(() => commands([".search.next", { "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.previous.add",
      (_) => _.runAsync(() => commands([".search.next", { "direction": -1, "add": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.search.selection.smart",
      (_) => _.runAsync(() => commands([".search.selection", { "smart": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "seek" module and returns its defined commands.
 */
async function loadSeekModule(): Promise<CommandDescriptor[]> {
  const {
    character,
    wordEnd,
    wordStart,
  } = await import("./seek");

  return [
    new CommandDescriptor(
      "dance.seek.character",
      (_, argument) => _.runAsync((_) => character(_, getInputOr(argument), getRepetitions(_, argument), getDirection(argument), getShift(argument), argument.include)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordEnd",
      (_, argument) => wordEnd(argument.ws, getShift(argument)),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart",
      (_, argument) => wordStart(argument.ws, getDirection(argument), getShift(argument)),
      CommandDescriptor.Flags.None,
    ),
    new CommandDescriptor(
      "dance.seek.character.backward",
      (_) => _.runAsync(() => commands([".seek.character", { "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.character.extend",
      (_) => _.runAsync(() => commands([".seek.character", { "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.character.extend.backward",
      (_) => _.runAsync(() => commands([".seek.character", { "shift": "extend", "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.character.included",
      (_) => _.runAsync(() => commands([".seek.character", { "include": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.character.included.backward",
      (_) => _.runAsync(() => commands([".seek.character", { "include": true, "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.character.included.extend",
      (_) => _.runAsync(() => commands([".seek.character", { "include": true, "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.character.included.extend.backward",
      (_) => _.runAsync(() => commands([".seek.character", { "include": true, "shift": "extend", "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordEnd.extend",
      (_) => _.runAsync(() => commands([".seek.wordEnd", { "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordEnd.ws",
      (_) => _.runAsync(() => commands([".seek.wordEnd", { "ws": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordEnd.ws.extend",
      (_) => _.runAsync(() => commands([".seek.wordEnd", { "ws": true, "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart.backward",
      (_) => _.runAsync(() => commands([".seek.wordStart", { "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart.extend",
      (_) => _.runAsync(() => commands([".seek.wordStart", { "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart.extend.backward",
      (_) => _.runAsync(() => commands([".seek.wordStart", { "shift": "extend", "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart.ws",
      (_) => _.runAsync(() => commands([".seek.wordStart", { "ws": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart.ws.backward",
      (_) => _.runAsync(() => commands([".seek.wordStart", { "ws": true, "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart.ws.extend",
      (_) => _.runAsync(() => commands([".seek.wordStart", { "ws": true, "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.seek.wordStart.ws.extend.backward",
      (_) => _.runAsync(() => commands([".seek.wordStart", { "ws": true, "shift": "extend", "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "select" module and returns its defined commands.
 */
async function loadSelectModule(): Promise<CommandDescriptor[]> {
  const {
    buffer,
    lineEnd,
    lineStart,
    line_above,
    line_above_extend,
    line_below,
    line_below_extend,
    toLine,
  } = await import("./select");

  return [
    new CommandDescriptor(
      "dance.select.buffer",
      (_) => _.runAsync((_) => buffer(_)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.line.above",
      (_, argument) => _.runAsync((_) => line_above(_, getCount(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.line.above.extend",
      (_, argument) => _.runAsync((_) => line_above_extend(_, getCount(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.line.below",
      (_, argument) => _.runAsync((_) => line_below(_, getCount(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.line.below.extend",
      (_, argument) => _.runAsync((_) => line_below_extend(_, getCount(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.lineEnd",
      (_, argument) => _.runAsync((_) => lineEnd(_, getCount(_, argument), getShift(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.lineStart",
      (_, argument) => _.runAsync((_) => lineStart(_, getCount(_, argument), getShift(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.toLine",
      (_, argument) => _.runAsync((_) => toLine(_, getCount(_, argument), getShift(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.lineEnd.extend",
      (_) => _.runAsync(() => commands([".select.lineEnd", { "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.select.lineStart.extend",
      (_) => _.runAsync(() => commands([".select.lineStart", { "shift": "extend" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "selections" module and returns its defined commands.
 */
async function loadSelectionsModule(): Promise<CommandDescriptor[]> {
  const {
    changeDirection,
    copy,
    extendToLines,
    filter,
    pipe,
    reduce,
    restore,
    restore_withCurrent,
    save,
    saveText,
    select,
    split,
    splitLines,
    toggleIndices,
    trimLines,
    trimWhitespace,
  } = await import("./selections");

  return [
    new CommandDescriptor(
      "dance.selections.changeDirection",
      (_, argument) => _.runAsync((_) => changeDirection(_, getDirection(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.copy",
      (_, argument) => _.runAsync((_) => copy(_, _.document, _.selections, getRepetitions(_, argument), getDirection(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.extendToLines",
      (_) => _.runAsync((_) => extendToLines(_)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.filter",
      (_, argument) => _.runAsync((_) => filter(_, getInput(argument), getSetInput(argument), argument.defaultInput, argument.inverse, argument.interactive)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.pipe",
      (_, argument) => _.runAsync((_) => pipe(_, getRegister(_, argument, "pipe", Register.Flags.CanWrite), getInputOr(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.reduce",
      (_, argument) => _.runAsync((_) => reduce(_, argument.handleCharacterBehavior, argument.where)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.restore",
      (_, argument) => _.runAsync((_) => restore(_, getRegister(_, argument, "caret", Register.Flags.CanReadSelections))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.restore.withCurrent",
      (_, argument) => _.runAsync((_) => restore_withCurrent(_, _.document, getRegister(_, argument, "caret", Register.Flags.CanReadSelections), argument.reverse)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.save",
      (_, argument) => _.runAsync((_) => save(_, _.document, _.selections, getRegister(_, argument, "caret", Register.Flags.CanWriteSelections), argument.style, argument.until)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.saveText",
      (_, argument) => saveText(_.document, _.selections, getRegister(_, argument, "dquote", Register.Flags.CanWrite)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.select",
      (_, argument) => _.runAsync((_) => select(_, argument.interactive, getInput(argument), getSetInput(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.split",
      (_, argument) => _.runAsync((_) => split(_, argument.excludeEmpty, argument.interactive, getInput(argument), getSetInput(argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.splitLines",
      (_, argument) => _.runAsync((_) => splitLines(_, _.document, _.selections, getRepetitions(_, argument))),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.toggleIndices",
      (_, argument) => _.runAsync((_) => toggleIndices(_, argument.display, argument.until)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.trimLines",
      (_) => _.runAsync((_) => trimLines(_)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.trimWhitespace",
      (_) => _.runAsync((_) => trimWhitespace(_)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.clear.main",
      (_) => _.runAsync(() => commands([".selections.filter", { "input": "i !== 0" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.clear.secondary",
      (_) => _.runAsync(() => commands([".selections.filter", { "input": "i === 0" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.copy.above",
      (_) => _.runAsync(() => commands([".selections.copy", { "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.faceBackward",
      (_) => _.runAsync(() => commands([".selections.changeDirection", { "direction": -1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.faceForward",
      (_) => _.runAsync(() => commands([".selections.changeDirection", { "direction": 1 }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.filter.regexp",
      (_) => _.runAsync(() => commands([".selections.filter", { "defaultInput": "/" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.filter.regexp.inverse",
      (_) => _.runAsync(() => commands([".selections.filter", { "defaultInput": "/", "inverse": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.hideIndices",
      (_) => _.runAsync(() => commands([".selections.toggleIndices", { "display": false }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.pipe.append",
      (_) => _.runAsync(() => commands([".selections.pipe"], [".edit.insert", { "register": "|", "where": "end" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.pipe.prepend",
      (_) => _.runAsync(() => commands([".selections.pipe"], [".edit.insert", { "register": "|", "where": "start" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.pipe.replace",
      (_) => _.runAsync(() => commands([".selections.pipe"], [".edit.insert", { "register": "|" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.reduce.edges",
      (_) => _.runAsync(() => commands([".selections.reduce", { "where": "both" }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.showIndices",
      (_) => _.runAsync(() => commands([".selections.toggleIndices", { "display": true  }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads the "selections.rotate" module and returns its defined commands.
 */
async function loadSelectionsRotateModule(): Promise<CommandDescriptor[]> {
  const {
    both,
    contents,
    selections,
  } = await import("./selections.rotate");

  return [
    new CommandDescriptor(
      "dance.selections.rotate.both",
      (_, argument) => _.runAsync((_) => both(_, getRepetitions(_, argument), argument.reverse)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.rotate.contents",
      (_, argument) => _.runAsync((_) => contents(_, getRepetitions(_, argument), argument.reverse)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.rotate.selections",
      (_, argument) => _.runAsync((_) => selections(_, getRepetitions(_, argument), argument.reverse)),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.rotate.both.reverse",
      (_) => _.runAsync(() => commands([".selections.rotate", { "reverse": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.rotate.contents.reverse",
      (_) => _.runAsync(() => commands([".selections.rotate.contents", { "reverse": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
    new CommandDescriptor(
      "dance.selections.rotate.selections.reverse",
      (_) => _.runAsync(() => commands([".selections.rotate.selections", { "reverse": true }])),
      CommandDescriptor.Flags.RequiresActiveEditor,
    ),
  ];
}

/**
 * Loads and returns all defined commands.
 */
export async function loadCommands(): Promise<Commands> {
  const allModules = await Promise.all([
    loadEditModule(),
    loadHistoryModule(),
    loadKeybindingsModule(),
    loadMiscModule(),
    loadModesModule(),
    loadSearchModule(),
    loadSeekModule(),
    loadSelectModule(),
    loadSelectionsModule(),
    loadSelectionsRotateModule(),
  ]);

  return Object.freeze(
    Object.fromEntries(allModules.flat().map((desc) => [desc.identifier, desc])),
  );
}
