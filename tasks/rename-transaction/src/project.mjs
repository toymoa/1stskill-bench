import { ts } from './typescript.mjs';
import path from 'node:path';
export class Project {
  constructor(files) {
    this.files = new Map(
      Object.entries(files).map(([name, text]) => ['/project/' + name, { text, version: 0 }]),
    );
    this.host = {
      getCompilationSettings: () => ({
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
      }),
      getScriptFileNames: () => [...this.files.keys()],
      getScriptVersion: (name) => String(this.files.get(name)?.version || 0),
      getScriptSnapshot: (name) => {
        const text = this.files.get(name)?.text ?? ts.sys.readFile(name);
        return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
      },
      getCurrentDirectory: () => '/project',
      getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
      fileExists: (name) => this.files.has(name) || ts.sys.fileExists(name),
      readFile: (name) => this.files.get(name)?.text ?? ts.sys.readFile(name),
      directoryExists: (name) =>
        name === '/project' ||
        [...this.files.keys()].some((f) => f.startsWith(name + '/')) ||
        ts.sys.directoryExists(name),
      realpath: (name) => name,
      readDirectory: () => [],
    };
    this.service = ts.createLanguageService(this.host);
  }
  set(name, text) {
    const key = '/project/' + name,
      old = this.files.get(key);
    this.files.set(key, { text, version: (old?.version || 0) + 1 });
  }
  output() {
    return Object.fromEntries(
      [...this.files].map(([name, x]) => [path.posix.relative('/project', name), x.text]),
    );
  }
}
