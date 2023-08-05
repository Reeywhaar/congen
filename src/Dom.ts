export class Dom {
  onChange?: () => void;

  private qs = <T extends Element = Element>(x: string) => {
    const el = document.querySelector(x);
    if (!el) throw new Error("el is null");
    return el as T;
  };

  controls = this.qs<HTMLDivElement>(".controls");
  scale = this.qs<HTMLInputElement>(".zinput");
  source = this.qs<HTMLSelectElement>(".src");
  uploadOption: HTMLOptionElement;
  appliedFilters = this.qs<HTMLDivElement>(".applied-filters");
  filterStack = this.qs<HTMLDivElement>(".filter-stack");
  generate = this.qs<HTMLButtonElement>(".genb");
  maskTileSize = this.qs<HTMLSelectElement>(".mask-tiles__value");
  saturation = this.qs<HTMLSelectElement>(".saturationInput");
  contrast = this.qs<HTMLSelectElement>(".contrastInput");
  brightness = this.qs<HTMLSelectElement>(".brightnessInput");
  download = this.qs<HTMLButtonElement>(".downloadb");

  addFilter(name: string) {
    const el = document.createElement("div");
    el.innerText = name;
    el.classList.add("filter-item");
    el.addEventListener("click", (e) => {
      this.appliedFilters.removeChild(el);
      this.onChange?.();
    });
    this.appliedFilters.appendChild(el);
  }
}
