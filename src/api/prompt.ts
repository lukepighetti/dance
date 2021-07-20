import * as vscode from "vscode";

import { Context, Selections } from ".";
import type { Input, SetInput } from "../commands";
import { CancellationError } from "../utils/errors";

const actionEvent = new vscode.EventEmitter<Parameters<typeof prompt.notifyActionRequested>[0]>();

/**
 * Displays a prompt to the user.
 */
export function prompt(
  options: prompt.Options,
  context = Context.WithoutActiveEditor.current,
) {
  if (options.value === undefined && options.history !== undefined && options.history.length > 0) {
    options.value = options.history[options.history.length - 1];
  }

  const inputBox = vscode.window.createInputBox();

  const promise = new Promise<string>((resolve, reject) => {
    // Ported from
    // https://github.com/microsoft/vscode/blob/14f61093f4312f7730135b9bc4bd97472e58ce04/src/vs/base/parts/quickinput/browser/quickInput.ts#L1465
    //
    // We can't use `showInputBox` because we may need to edit the text of the
    // box while it is open, so we do everything manually below.
    const token = context.cancellationToken;

    if (token.isCancellationRequested) {
      return reject(new CancellationError(CancellationError.Reason.CancellationToken));
    }

    const validateInput = options.validateInput ?? (() => Promise.resolve(undefined));

    let validationValue = options.value ?? "",
        validation = Promise.resolve(validateInput(validationValue));

    let historyIndex = options.history?.length,
        lastHistoryValue = validationValue;

    function updateAndValidateValue(value: string, setValue = false) {
      if (setValue) {
        inputBox.value = value;
      }

      if (value !== validationValue) {
        validation = Promise.resolve(validateInput(value));
        validationValue = value;
      }

      validation.then((result) => {
        if (value === validationValue) {
          inputBox.validationMessage = result ?? undefined;
        }
      });
    }

    const disposables = [
      inputBox,
      inputBox.onDidChangeValue(updateAndValidateValue),
      inputBox.onDidAccept(() => {
        const value = inputBox.value;

        if (value !== validationValue) {
          validation = Promise.resolve(validateInput(value));
          validationValue = value;
        }

        validation.then((result) => {
          if (result == null) {
            const history = options.history,
                  historySize = options.historySize ?? 50;

            if (history !== undefined) {
              const existingIndex = history.indexOf(value);

              if (existingIndex !== -1) {
                history.splice(existingIndex, 1);
              }

              history.push(value);

              if (history.length > historySize) {
                history.shift();
              }
            }

            resolve(value);
            inputBox.hide();
          } else if (value === validationValue) {
            inputBox.validationMessage = result ?? undefined;
          }
        });
      }),
      token.onCancellationRequested(() => {
        inputBox.hide();
      }),
      inputBox.onDidHide(() => {
        disposables.forEach((d) => d.dispose());

        const reason = context.cancellationToken?.isCancellationRequested
          ? CancellationError.Reason.CancellationToken
          : CancellationError.Reason.PressedEscape;

        // Note: ignored if resolve() was previously called with a valid value.
        reject(new CancellationError(reason));
      }),
      actionEvent.event((action) => {
        switch (action) {
        case "clear":
          updateAndValidateValue("", /* setValue= */ true);
          break;

        case "next":
          if (historyIndex !== undefined) {
            if (historyIndex === options.history!.length) {
              return;
            }

            historyIndex++;

            if (historyIndex === options.history!.length) {
              updateAndValidateValue(lastHistoryValue, /* setValue= */ true);
            } else {
              updateAndValidateValue(options.history![historyIndex], /* setValue= */ true);
            }
          }
          break;

        case "previous":
          if (historyIndex !== undefined) {
            if (historyIndex === 0) {
              return;
            }

            if (historyIndex === options.history!.length) {
              lastHistoryValue = inputBox.value;
            }

            historyIndex--;
            updateAndValidateValue(options.history![historyIndex], /* setValue= */ true);
          }
          break;
        }
      }),
    ];

    updateAndValidateValue(options.value ?? "", /* setValue= */ true);

    inputBox.title = options.title;
    inputBox.prompt = options.prompt;
    inputBox.placeholder = options.placeHolder;
    inputBox.password = !!options.password;
    inputBox.ignoreFocusOut = !!options.ignoreFocusOut;

    // Hack to set the `valueSelection`, since it isn't supported when using
    // `createInputBox`.
    if (options.valueSelection !== undefined) {
      (inputBox as any).update({ valueSelection: options.valueSelection });
    }

    inputBox.show();
  });

  return context.wrap(promise);
}

export namespace prompt {
  type RegExpFlag = "m" | "u" | "s" | "y" | "i" | "g";
  type RegExpFlags = RegExpFlag
                   | `${RegExpFlag}${RegExpFlag}`
                   | `${RegExpFlag}${RegExpFlag}${RegExpFlag}`
                   | `${RegExpFlag}${RegExpFlag}${RegExpFlag}${RegExpFlag}`;

  /**
   * Options for spawning a `prompt`.
   */
  export interface Options extends vscode.InputBoxOptions {
    readonly history?: string[];
    readonly historySize?: number;
  }

  /**
   * Returns `vscode.InputBoxOptions` that only validate if a number in a given
   * range is entered.
   */
  export function numberOpts(
    opts: { integer?: boolean; range?: [number, number] } = {},
  ): vscode.InputBoxOptions {
    return {
      validateInput(input) {
        const n = +input;

        if (isNaN(n)) {
          return "Invalid number.";
        }

        if (opts.range && (n < opts.range[0] || n > opts.range[1])) {
          return `Number out of range ${JSON.stringify(opts.range)}.`;
        }

        if (opts.integer && (n | 0) !== n) {
          return `Number must be an integer.`;
        }

        return;
      },
    };
  }

  /**
   * Equivalent to `+await prompt(numberOpts(), context)`.
   */
  export function number(
    opts: Parameters<typeof numberOpts>[0],
    context = Context.WithoutActiveEditor.current,
  ) {
    return prompt(numberOpts(opts), context).then((x) => +x);
  }

  /**
   * Last used inputs for `regexp` prompts.
   */
  export const regexpHistory: string[] = [];

  /**
   * Returns `vscode.InputBoxOptions` that only validate if a valid ECMAScript
   * regular expression is entered.
   */
  export function regexpOpts(flags: RegExpFlags): prompt.Options {
    return {
      prompt: "Regular expression",
      validateInput(input) {
        if (input.length === 0) {
          return "RegExp cannot be empty";
        }

        try {
          new RegExp(input, flags);

          return undefined;
        } catch {
          return "invalid RegExp";
        }
      },

      history: regexpHistory,
    };
  }

  /**
   * Equivalent to `new RegExp(await prompt(regexpOpts(flags), context), flags)`.
   */
  export function regexp(
    flags: RegExpFlags,
    context = Context.WithoutActiveEditor.current,
  ) {
    return prompt(regexpOpts(flags), context).then((x) => new RegExp(x, flags));
  }

  /**
   * Prompts the user for a result interactively.
   */
  export function interactive<T>(
    compute: (input: string) => T | Thenable<T>,
    reset: () => void,
    options: vscode.InputBoxOptions = {},
    interactive: boolean = true,
  ): Thenable<T> {
    let result: T;
    const validateInput = options.validateInput;

    if (!interactive) {
      return prompt(options).then((value) => compute(value));
    }

    return prompt({
      ...options,
      async validateInput(input) {
        const validationError = await validateInput?.(input);

        if (validationError) {
          return validationError;
        }

        try {
          result = await compute(input);
          return;
        } catch (e) {
          return `${e}`;
        }
      },
    }).then(
      () => result,
      (err) => {
        reset();
        throw err;
      },
    );
  }

  /**
   * @internal
   */
  export async function manipulateSelectionsInteractively<I, R>(
    _: Context,
    input: Input<I>,
    setInput: SetInput<R>,
    interactive: boolean,
    options: prompt.Options,
    f: (input: string | I, selections: readonly vscode.Selection[]) => Thenable<R>,
  ) {
    const selections = _.selections;

    function execute(input: string | I) {
      return _.runAsync(() => f(input, selections));
    }

    function undo() {
      Selections.set(selections);
    }

    if (input === undefined) {
      setInput(await prompt.interactive(execute, undo, options, interactive));
    } else {
      await execute(input);
    }
  }

  export type ListPair = readonly [string, string];

  /**
   * Prompts the user to choose one item among a list of items, and returns the
   * index of the item that was picked.
   */
  export function one(
    items: readonly ListPair[],
    init?: (quickPick: vscode.QuickPick<vscode.QuickPickItem>) => void,
    context = Context.WithoutActiveEditor.current,
  ) {
    return promptInList(false, items, init ?? (() => {}), context.cancellationToken);
  }

  export namespace one {
    /**
     * Prompts the user for actions in a menu, only hiding it when a
     * cancellation is requested or `Escape` pressed.
     */
    export function locked(
      items: readonly (readonly [string, string, () => void])[],
      init?: (quickPick: vscode.QuickPick<vscode.QuickPickItem>) => void,
      cancellationToken = Context.WithoutActiveEditor.current.cancellationToken,
    ) {
      const itemsKeys = items.map(([k, _]) => k.includes(", ") ? k.split(", ") : [...k]);

      return new Promise<void>((resolve, reject) => {
        const quickPick = vscode.window.createQuickPick(),
              quickPickItems = [] as vscode.QuickPickItem[];

        let isCaseSignificant = false;

        for (let i = 0; i < items.length; i++) {
          const [label, description] = items[i];

          quickPickItems.push({ label, description });
          isCaseSignificant = isCaseSignificant || label.toLowerCase() !== label;
        }

        quickPick.items = quickPickItems;
        quickPick.placeholder = "Press one of the below keys.";

        const subscriptions = [
          quickPick.onDidChangeValue((rawKey) => {
            quickPick.value = "";

            // This causes the menu to disappear and reappear for a frame, but
            // without this the shown items don't get refreshed after the value
            // change above.
            quickPick.items = quickPickItems;

            let key = rawKey;

            if (!isCaseSignificant) {
              key = key.toLowerCase();
            }

            const index = itemsKeys.findIndex((x) => x.includes(key));

            if (index !== -1) {
              items[index][2]();
            }
          }),

          quickPick.onDidHide(() => {
            subscriptions.splice(0).forEach((s) => s.dispose());

            resolve();
          }),

          quickPick.onDidAccept(() => {
            subscriptions.splice(0).forEach((s) => s.dispose());

            const picked = quickPick.selectedItems[0];

            try {
              items.find((x) => x[1] === picked.description)![2]();
            } finally {
              resolve();
            }
          }),

          cancellationToken?.onCancellationRequested(() => {
            subscriptions.splice(0).forEach((s) => s.dispose());

            reject(new CancellationError(CancellationError.Reason.CancellationToken));
          }),

          quickPick,
        ];

        init?.(quickPick);

        quickPick.show();
      });
    }
  }

  /**
   * Prompts the user to choose many items among a list of items, and returns a
   * list of indices of picked items.
   */
  export function many(
    items: readonly ListPair[],
    init?: (quickPick: vscode.QuickPick<vscode.QuickPickItem>) => void,
    context = Context.WithoutActiveEditor.current,
  ) {
    return promptInList(true, items, init ?? (() => {}), context.cancellationToken);
  }

  /**
   * Notifies an active prompt, if any, that an action has been requested.
   */
  export function notifyActionRequested(action: "next" | "previous" | "clear") {
    actionEvent.fire(action);
  }
}

/**
 * Awaits a keypress from the user and returns the entered key.
 */
export function keypress(context = Context.current): Promise<string> {
  if (context.cancellationToken.isCancellationRequested) {
    return Promise.reject(new CancellationError(CancellationError.Reason.CancellationToken));
  }

  const previousMode = context.mode;

  return context.switchToMode(context.extension.modes.inputMode).then(() =>
    new Promise<string>((resolve, reject) => {
      try {
        const subscriptions = [
          vscode.commands.registerCommand("type", ({ text }: { text: string }) => {
            if (subscriptions.length > 0) {
              subscriptions.splice(0).forEach((s) => s.dispose());
              context.switchToMode(previousMode).then(() => resolve(text));
            }
          }),

          context.cancellationToken.onCancellationRequested(() => {
            if (subscriptions.length > 0) {
              subscriptions.splice(0).forEach((s) => s.dispose());
              context.switchToMode(previousMode)
                .then(() => reject(
                  new CancellationError(
                    context.extension.cancellationReasonFor(context.cancellationToken)
                    ?? CancellationError.Reason.CancellationToken)));
            }
          }),
        ];
      } catch {
        reject(new Error("unable to listen to keyboard events; is an extension "
                        + 'overriding the "type" command (e.g VSCodeVim)?'));
      }
    }),
  );
}

export namespace keypress {
  /**
   * Awaits a keypress describing a register and returns the specified register.
   */
  export async function forRegister(context = Context.current) {
    const firstKey = await keypress(context);

    if (firstKey !== " ") {
      return context.extension.registers.get(firstKey);
    }

    const secondKey = await keypress(context);

    return context.extension.registers.forDocument(context.document).get(secondKey);
  }
}

function promptInList(
  canPickMany: true,
  items: readonly (readonly [string, string])[],
  init: (quickPick: vscode.QuickPick<vscode.QuickPickItem>) => void,
  cancellationToken: vscode.CancellationToken,
): Thenable<string | number[]>;
function promptInList(
  canPickMany: false,
  items: readonly (readonly [string, string])[],
  init: (quickPick: vscode.QuickPick<vscode.QuickPickItem>) => void,
  cancellationToken: vscode.CancellationToken,
): Thenable<string | number>;

function promptInList(
  canPickMany: boolean,
  items: readonly (readonly [string, string])[],
  init: (quickPick: vscode.QuickPick<vscode.QuickPickItem>) => void,
  cancellationToken: vscode.CancellationToken,
): Thenable<string | number | number[]> {
  const itemsKeys = items.map(([k, _]) => k.includes(", ") ? k.split(", ") : [...k]);

  return new Promise<string | number | number[]>((resolve, reject) => {
    const quickPick = vscode.window.createQuickPick(),
          quickPickItems = [] as vscode.QuickPickItem[];

    let isCaseSignificant = false;

    for (let i = 0; i < items.length; i++) {
      const [label, description] = items[i];

      quickPickItems.push({ label, description });
      isCaseSignificant = isCaseSignificant || label.toLowerCase() !== label;
    }

    quickPick.items = quickPickItems;
    quickPick.placeholder = "Press one of the below keys.";
    quickPick.canSelectMany = canPickMany;

    const subscriptions = [
      quickPick.onDidChangeValue((rawKey) => {
        if (subscriptions.length === 0) {
          return;
        }

        let key = rawKey;

        if (!isCaseSignificant) {
          key = key.toLowerCase();
        }

        const index = itemsKeys.findIndex((x) => x.includes(key));

        subscriptions.splice(0).forEach((s) => s.dispose());

        if (index === -1) {
          return resolve(rawKey);
        }

        if (canPickMany) {
          resolve([index]);
        } else {
          resolve(index);
        }
      }),

      quickPick.onDidAccept(() => {
        if (subscriptions.length === 0) {
          return;
        }

        let picked = quickPick.selectedItems;

        if (picked !== undefined && picked.length === 0) {
          picked = quickPick.activeItems;
        }

        subscriptions.splice(0).forEach((s) => s.dispose());

        if (picked === undefined) {
          return reject(new CancellationError(CancellationError.Reason.PressedEscape));
        }

        if (canPickMany) {
          resolve(picked.map((x) => items.findIndex((item) => item[1] === x.description)));
        } else {
          resolve(items.findIndex((x) => x[1] === picked[0].description));
        }
      }),

      quickPick.onDidHide(() => {
        if (subscriptions.length === 0) {
          return;
        }

        subscriptions.splice(0).forEach((s) => s.dispose());

        reject(new CancellationError(CancellationError.Reason.PressedEscape));
      }),

      cancellationToken?.onCancellationRequested(() => {
        if (subscriptions.length === 0) {
          return;
        }

        subscriptions.splice(0).forEach((s) => s.dispose());

        reject(new CancellationError(CancellationError.Reason.CancellationToken));
      }),

      quickPick,
    ];

    init(quickPick);

    quickPick.show();
  });
}
