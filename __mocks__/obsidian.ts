// Jest stub for the `obsidian` package — the published package is type-only,
// so we provide a runtime shim so ts-jest can compile + execute test code.
// Tests don't actually invoke any Obsidian runtime; this is purely to satisfy
// `import { ... } from "obsidian"` at module-load time.

export async function requestUrl(_param: unknown): Promise<{
  status: number;
  text: string;
  json: unknown;
  headers: Record<string, string>;
}> {
  throw new Error("requestUrl mock called — no test should hit the network");
}

export class Plugin {}
export class PluginSettingTab {}
export class Modal {}
export class Setting {}
export class Notice {}
export class TFile {}
export class TFolder {}
export class TAbstractFile {}
export class Vault {}
export class Workspace {}
export class App {}
