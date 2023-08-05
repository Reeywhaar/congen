import { Dom } from "./Dom";
import { SerializableState } from "./SerializableState";
import * as filters from "./filters";

export class Prefs {
  source: string;
  maskTileSize: number;
  distribution: number;
  scale: number;
  saturation: number;
  contrast: number;
  brightness: number;
  appliedEffectsNames: string[];

  constructor(dom: Dom) {
    this.source = dom.source.value;
    this.maskTileSize = parseInt(dom.maskTileSize.value, 10) || 0;
    this.distribution = 0;
    this.scale = parseFloat(dom.scale.value) || 1;
    this.saturation = parseFloat(dom.saturation.value) || 0;
    this.contrast = parseFloat(dom.contrast.value) || 0;
    this.brightness = parseFloat(dom.brightness.value) || 0;
    this.appliedEffectsNames = Array.from(dom.appliedFilters.childNodes).map(
      (x) => (x as HTMLDivElement).innerText,
    );
  }

  restore(state: SerializableState) {
    if (typeof state.source !== "undefined") this.source = state.source;
    if (typeof state.scale !== "undefined") this.scale = state.scale;
    if (typeof state.saturation !== "undefined")
      this.saturation = state.saturation;
    if (typeof state.contrast !== "undefined") this.contrast = state.contrast;
    if (typeof state.brightness !== "undefined")
      this.brightness = state.brightness;
    if (typeof state.maskTileSize !== "undefined")
      this.maskTileSize = state.maskTileSize;
    if (typeof state.filters !== "undefined")
      this.appliedEffectsNames = state.filters;
  }

  get appliedEffects() {
    return this.appliedEffectsNames.map(
      (x) => filters[x as keyof typeof filters],
    );
  }
}
