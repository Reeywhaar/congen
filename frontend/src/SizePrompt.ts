import { LocalStorageManager } from "./LocalStorageManager";

export class SizePrompt {
  private sizeLocalStorage = new LocalStorageManager<[number, number] | null>(
    "gen__size",
    (value) => JSON.stringify(value),
    (value) => (value ? JSON.parse(value) : null),
  );

  prompt(defaultWidth: number, defaultHeight: number): [number, number] | null {
    const stored = this.sizeLocalStorage.get();
    const width = parseFloat(
      prompt(
        "Width (default is screen size)",
        String(stored?.at(0) ?? defaultWidth),
      ) ?? "0",
    );
    if (!width) return null;
    const height = parseFloat(
      prompt(
        "Height (default is screen size)",
        String(stored?.at(1) ?? defaultHeight),
      ) ?? "0",
    );
    if (!height) return null;

    this.sizeLocalStorage.set([width, height]);

    return [width, height];
  }
}
