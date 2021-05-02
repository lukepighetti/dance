import * as glob  from "glob";
import * as Mocha from "mocha";
import * as path  from "path";
import { promises as fs } from "fs";

export async function run(testsRoot: string) {
  // Create the mocha test.
  const currentFile = (process.env.CURRENT_FILE ?? "").replace(/\\/g, "/"),
        currentLine = process.env.CURRENT_LINE ? +process.env.CURRENT_LINE - 1 : undefined,
        rootPath = path.join(__dirname, "../../.."),
        mocha = new Mocha({ ui: "tdd", color: true, timeout: 0 });

  let files = await new Promise<readonly string[]>((resolve, reject) => {
    glob("**/**.test.js", { cwd: testsRoot }, (err, matches) => {
      if (err) {
        return reject(err);
      }

      return resolve(matches);
    });
  });

  if (currentFile === "test/README.md") {
    mocha.grep("ExpectedDocument#parse");

    files = ["utils.test.js"];
  } else if (currentFile.startsWith("test/suite/commands/")) {
    if (currentFile.endsWith(".md")) {
      files = [path.join("commands", path.basename(currentFile, ".md") + ".test.js")];

      if (currentLine !== undefined) {
        const filePath = path.join(rootPath, "test/suite/commands", path.basename(currentFile)),
              contents = await fs.readFile(filePath, "utf-8"),
              lines = contents.split("\n");

        for (let i = currentLine; i >= 0; i--) {
          const line = lines[i],
                match = /^#+ (.+)$/.exec(line);

          if (match !== null) {
            const parts = match[1].split(" "),
                  dependencies = [parts[0] + "$"];

            for (let i = 1; i < parts.length; i++) {
              dependencies.push(parts.slice(0, i).join(" ") + " → " + parts[i] + "$");
            }

            mocha.grep(new RegExp(dependencies.join("|")));
            break;
          }
        }
      }
    } else if (currentFile.endsWith(".test.ts")) {
      files = [path.join("commands", path.basename(currentFile, ".ts") + ".js")];
    }
  } else if (currentFile.includes(".test.")) {
    const currentFileAsJs = path.basename(currentFile).replace(/\.ts$/, ".js");

    files = files.filter((f) => f.endsWith(currentFileAsJs));
  } else if (currentFile.startsWith("src/api/")) {
    mocha.grep(currentFile.slice(8));

    files = ["api.test.js"];

    if (currentLine !== undefined) {
      const filePath = path.join(rootPath, "src/api", currentFile.slice(8)),
            contents = await fs.readFile(filePath, "utf-8"),
            lines = contents.split("\n");
      let direction = -1;

      if (/^[ /]+\*/.test(lines[currentLine])) {
        direction = 1;
      }

      for (let i = currentLine; i >= 0 && i < lines.length; i += direction) {
        const line = lines[i],
              match = /^ *export function (\w+)/.exec(line);

        if (match !== null) {
          mocha.grep(currentFile.slice(8) + ".+" + match[1]);
          break;
        }
      }
    }
  } else if (currentFile.startsWith("src/commands")) {
    files = files.filter((f) => f.startsWith("commands/"));
  } else if (currentFile.length > 0) {
    files = [];
  }

  // Add files to the test suite.
  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

  // Run the mocha test.
  await new Promise<number>((resolve) => mocha.run(resolve));
}
