export class LocalStorageManager<T> {
  private label: string;
  private marshal: (x: T) => string;
  private unmarshal: (x: string) => T;

  constructor(
    label: string,
    marshal: (x: T) => string,
    unmarshal: (x: string) => T,
  ) {
    this.label = label;
    this.marshal = marshal;
    this.unmarshal = unmarshal;
  }

  get(): T | null {
    try {
      return this.unmarshal(localStorage.getItem(this.label) ?? "");
    } catch (e) {
      return null;
    }
  }

  set(value: T) {
    try {
      localStorage.setItem(this.label, this.marshal(value));
    } catch (e) {
      console.warn(`[LocalStorageManager] Could't set ${this.label}`, e);
    }
  }
}
