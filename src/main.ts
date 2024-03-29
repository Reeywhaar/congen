import * as tools from "./tools";
import { C } from "./ctools";
import * as filters from "./filters";
import images from "./list";
import { alea } from "seedrandom";
import { LocalStorageManager } from "./LocalStorageManager";
import { Database, DatabaseFile } from "./Database";
import { PrefsSerializer } from "./PrefsSerializer";
import { Prefs } from "./Prefs";
import { Dom } from "./Dom";
import { SerializableState } from "./SerializableState";
import { SizePrompt } from "./SizePrompt";

async function main() {
  const canvas = document.querySelector("canvas")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let seed = Math.random();

  const dom = new Dom();

  const db = new Database();
  await db.initialize();

  const storedPrefsState = stateLocalStorage.get();
  if (storedPrefsState) {
    const prefs = new Prefs(dom);
    prefs.restore(storedPrefsState);

    dom.scale.value = String(prefs.scale);
    dom.saturation.value = String(prefs.saturation);
    dom.contrast.value = String(prefs.contrast);
    dom.brightness.value = String(prefs.brightness);
    dom.maskTileSize.value = String(prefs.maskTileSize);
    for (const filter of prefs.appliedEffectsNames) {
      dom.addFilter(filter);
    }
  }

  const update = tools.debounce(() => {
    stateLocalStorage.set(new PrefsSerializer().serialize(new Prefs(dom)));
    generate(canvas, window.innerWidth, window.innerHeight);
  }, 200);

  dom.onChange = update;

  dom.download.addEventListener("click", async () => {
    const ocanvas = new OffscreenCanvas(100, 100);
    const size = new SizePrompt().prompt(canvas.width, canvas.height);
    if (!size) return;
    const [width, height] = size;

    await generate(ocanvas, width, height);
    const blob = await ocanvas.convertToBlob({
      quality: 0.9,
      type: "image/jpeg",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "congen-texture.jpg";
    a.style.display = "none";
    a.href = url;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  [dom.scale, dom.maskTileSize].forEach((e) => {
    e.addEventListener("keydown", (e) => {
      if ((e as any).which === 71) e.preventDefault();
      if ((e as any).which === 13) {
        update();
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    // 71 is g
    if (e.which === 71) update();
  });

  window.addEventListener(
    "resize",
    tools.debounce((e) => {
      update();
    }, 200),
  );

  images.forEach((src) => {
    const opt = document.createElement("option");
    opt.value = src;
    opt.innerText = src.substring(src.lastIndexOf("/") + 1);
    dom.source.appendChild(opt);
  });

  const droppedImages: Record<string, HTMLImageElement> = {};

  let selectedImage = [
    dom.source.selectedIndex,
    await tools.readImage(dom.source.options[dom.source.selectedIndex].value),
  ] as const;

  [dom.brightness, dom.contrast, dom.saturation].forEach((el) => {
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });

  const selectChangeHandler = tools.debounce(
    async () => {
      const selectedOption = dom.source.options[dom.source.selectedIndex];
      if (selectedOption.value === UPLOAD_CUSTOM_OPTION_ID) {
        dom.source.selectedIndex = selectedImage[0];

        const file = await tools.promptImage();
        if (!file) return;

        addFile(file);

        return;
      }

      const name = selectedOption.value;
      selectedImage = [
        dom.source.selectedIndex,
        selectedOption.dataset.custom === "true"
          ? droppedImages[name]
          : await tools.readImage(name),
      ];
      update();
    },
    100,
    true,
  );

  dom.source.addEventListener("change", selectChangeHandler);
  dom.source.addEventListener("blur", selectChangeHandler); // ios safari

  document.body.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  const addDatabaseFileToSelect = async (file: DatabaseFile) => {
    const url = URL.createObjectURL(file);
    const id = file.dbid;
    const image = await tools.readImage(url);

    droppedImages[id] = image;

    const selectItem = document.createElement("option");
    selectItem.value = id;
    selectItem.innerText = id;
    selectItem.dataset.custom = "true";
    dom.source.insertBefore(selectItem, dom.uploadOption);
  };

  const addFile = async (file: File) => {
    const dbfile = await db.addImage(file);
    await addDatabaseFileToSelect(dbfile);
    dom.source.value = dbfile.dbid;
    dom.source.dispatchEvent(new Event("change"));
  };

  try {
    const images = await db.getImages();
    await Promise.all(images.map((file) => addDatabaseFileToSelect(file)));
  } catch (e) {
    console.warn(e);
  }

  {
    const uploadOption = document.createElement("option");
    dom.uploadOption = uploadOption;
    uploadOption.value = UPLOAD_CUSTOM_OPTION_ID;
    uploadOption.innerText = "Upload image...";
    dom.source.appendChild(uploadOption);
  }

  if (storedPrefsState) {
    const prefs = new Prefs(dom);
    prefs.restore(storedPrefsState);
    if (prefs.source) {
      const ind = Array.from(dom.source.options).findIndex(
        (o) => o.value === prefs.source,
      );
      if (ind !== -1) {
        dom.source.selectedIndex = ind;
        dom.source.dispatchEvent(new Event("change"));
      }
    }
  }

  document.body.addEventListener("drop", async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file) return;

    await addFile(file);
  });

  Object.keys(filters).forEach((filter) => {
    const opt = document.createElement("div");
    opt.classList.add("filter-item");
    opt.innerText = filter;
    opt.addEventListener("click", (e) => {
      dom.addFilter(opt.innerText);
      update();
    });
    dom.filterStack.appendChild(opt);
  });

  const generate = async (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    width: number,
    height: number,
  ) => {
    const max = 20000;
    canvas.width = Math.min(width, max);
    canvas.height = Math.min(height, max);
    const prefs = new Prefs(dom);

    const rng = alea(String(seed));

    const c = new C(
      canvas.getContext("webgl", {
        preserveDrawingBuffer:
          location.search.indexOf("nopreserve") > -1 ? false : true,
      }) as WebGLRenderingContext,
      rng,
    );

    const tileX = tools.randomInt(
      selectedImage[1].width * 0.2,
      selectedImage[1].width - prefs.maskTileSize,
      rng,
    );
    const tileY = tools.randomInt(
      selectedImage[1].height * 0.2,
      selectedImage[1].height - prefs.maskTileSize,
      rng,
    );

    let texture = await c.tile(c.createTexture(selectedImage[1]), {
      scale: prefs.scale,
      srcWidth: tileX,
      srcHeight: tileY,
      dstWidth: canvas.width + prefs.distribution * 2,
      dstHeight: canvas.height + prefs.distribution * 2,
    });
    if (prefs.maskTileSize > 0) {
      texture = c.maskTiles(
        texture,
        tileX * prefs.scale,
        tileY * prefs.scale,
        prefs.maskTileSize,
      );
    }
    if (prefs.distribution > 0) {
      texture = c.diffuse(texture, prefs.distribution);
    }
    if (prefs.appliedEffects.length > 0) {
      texture = c.applyEffects(texture, prefs.appliedEffects);
    }
    if (prefs.saturation || prefs.brightness || prefs.contrast) {
      texture = c.adjust(
        texture,
        prefs.saturation,
        prefs.contrast,
        prefs.brightness,
      );
    }
    c.render(texture, {
      srcX: prefs.distribution,
      srcY: -prefs.distribution,
    });
  };

  dom.generate.addEventListener("click", async (e) => {
    ++seed;
    generate(canvas, window.innerWidth, window.innerHeight);
  });

  dom.generate.click();
}

const stateLocalStorage = new LocalStorageManager<SerializableState | null>(
  "gen__state",
  (value) => JSON.stringify(value),
  (value) => new PrefsSerializer().parse(JSON.parse(value)),
);

const UPLOAD_CUSTOM_OPTION_ID = "upload-custom";

main();
