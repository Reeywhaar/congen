import { Prefs } from "./Prefs";
import { SerializableState } from "./SerializableState";

export class PrefsSerializer {
  serialize(prefs: Prefs): SerializableState {
    return {
      source: prefs.source,
      scale: prefs.scale,
      filters: prefs.appliedEffectsNames,
      brightness: prefs.brightness,
      contrast: prefs.contrast,
      saturation: prefs.saturation,
      maskTileSize: prefs.maskTileSize,
    };
  }

  parse(data?: Record<string, any>): SerializableState | null {
    if (!data) return null;

    return {
      source: data.source,
      scale: typeof data.scale === "number" ? data.scale : undefined,
      filters: Array.isArray(data.filters) ? data.filters : undefined,
      brightness:
        typeof data.brightness === "number" ? data.brightness : undefined,
      contrast: typeof data.contrast === "number" ? data.contrast : undefined,
      saturation:
        typeof data.saturation === "number" ? data.saturation : undefined,
      maskTileSize:
        typeof data.maskTileSize === "number" ? data.maskTileSize : undefined,
    };
  }
}
