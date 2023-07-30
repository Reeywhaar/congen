import * as tools from "./tools";
import { C } from "./ctools";
import * as filters from "./filters";
import images from "./list";
import { alea } from "seedrandom";

async function main() {
  const canvas = document.querySelector("canvas")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let seed = Math.random();


  const qs = <T extends Element = Element>(x: string) => {
    const el = document.querySelector(x);
    if (!el) throw new Error("el is null");
    return el as T;
  };

  const dom = {
    controls: qs<HTMLDivElement>(".controls"),
    scale: qs<HTMLInputElement>(".zinput"),
    tileWidth: qs<HTMLInputElement>(".txinput"),
    tileHeight: qs<HTMLInputElement>(".tyinput"),
    source: qs<HTMLSelectElement>(".src"),
    appliedFilters: qs<HTMLDivElement>(".applied-filters"),
    filterStack: qs<HTMLDivElement>(".filter-stack"),
    generate: qs<HTMLButtonElement>(".genb"),
    maskTileSize: qs<HTMLSelectElement>(".mask-tiles__value"),
    saturation: qs<HTMLSelectElement>(".saturationInput"),
    contrast: qs<HTMLSelectElement>(".contrastInput"),
    brightness: qs<HTMLSelectElement>(".brightnessInput"),
    download: qs<HTMLButtonElement>(".downloadb"),
    droppedImage: qs<HTMLDivElement>(".dropped-image__container"),
  };

  const fire = tools.debounce(() => {
    generate(canvas, window.innerWidth, window.innerHeight)
  }, 200);

  dom.download.addEventListener("click", async () => {
    const ocanvas = new OffscreenCanvas(100, 100)
    const width = parseFloat(prompt("Width (default is screen size)", String(canvas.width)))
    if (!width) return
    const height = parseFloat(prompt("Height (default is screen size)", String(canvas.height)))
    if (!height) return

    await generate(ocanvas, width, height)
    const blob = await ocanvas.convertToBlob({
      quality: 0.9,
      type: "image/jpeg",
    })
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "congen-texture.jpg";
    a.style.display = "none";
    a.href = url;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  [
    dom.scale,
    dom.tileWidth,
    dom.tileHeight,
    dom.maskTileSize,
  ].forEach(e => {
    e.addEventListener("keydown", e => {
      if ((e as any).which === 71) e.preventDefault();
      if ((e as any).which === 13) {
        fire();
      }
    });
  });

  document.addEventListener("keydown", e => {
    // 71 is g
    if (e.which === 71) fire();
  });

  window.addEventListener("resize", tools.debounce(e => {
    fire()
  }, 200))

  images.forEach(src => {
    const opt = document.createElement("option");
    opt.value = src;
    opt.innerText = src.substr(src.lastIndexOf("/") + 1);
    dom.source.appendChild(opt);
  });

  let droppedImage: HTMLImageElement;
  let selectedImage = await readImage(
    dom.source.options[dom.source.selectedIndex].value
  );

  [dom.brightness, dom.contrast, dom.saturation].forEach(el => {
    el.addEventListener("change", async () => {
      fire();
    });
  })

  dom.source.addEventListener("change", async () => {
    selectedImage = await readImage(
      dom.source.options[dom.source.selectedIndex].value
    );
    dom.droppedImage.innerHTML = "";
    droppedImage = null;
    fire();
  });

  document.body.addEventListener("dragover", e => {
    e.preventDefault();
  });

  document.body.addEventListener("drop", async e => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0]
    if (!file) return;
    const name = file.name;
    const url = URL.createObjectURL(file);
    droppedImage = await readImage(url);

    const el = document.createElement("span");
    el.innerText = `Uploaded image: ${name}`;
    el.addEventListener("click", () => {
      dom.droppedImage.removeChild(el);
      droppedImage = null;
      fire();
    });
    dom.droppedImage.innerHTML = "";
    dom.droppedImage.appendChild(el);

    fire();
  });

  Object.keys(filters).forEach(filter => {
    const opt = document.createElement("div");
    opt.classList.add("filter-item");
    opt.innerText = filter;
    opt.addEventListener("click", e => {
      const el = document.createElement("div");
      el.innerText = opt.innerText;
      el.classList.add("filter-item");
      el.addEventListener("click", e => {
        dom.appliedFilters.removeChild(el);
        fire();
      });
      dom.appliedFilters.appendChild(el);
      fire();
    });
    dom.filterStack.appendChild(opt);
  });

  const getPrefs = () => {
    const image = droppedImage || selectedImage;
    const p = {
      image,
      tileX:
        Math.min(parseInt(dom.tileWidth.value, 10), image.width) ||
        canvas.width / 8,
      tileY:
        Math.min(parseInt(dom.tileHeight.value, 10), image.width) ||
        canvas.width / 8,
      maskTileSize: parseInt(dom.maskTileSize.value, 10) || 0,
      distribution: 0,
      scale: parseFloat(dom.scale.value) || 1,
      saturation: parseFloat(dom.saturation.value) || 0,
      contrast: parseFloat(dom.contrast.value) || 0,
      brightness: parseFloat(dom.brightness.value) || 0,
      appliedEffects: Array.from(dom.appliedFilters.childNodes)
        .map(x => (x as HTMLDivElement).innerText)
        .map(x => filters[x as keyof typeof filters]),
    };
    return p;
  };

  const generate = async (canvas: HTMLCanvasElement | OffscreenCanvas, width: number, height: number) => {
    const max = 20000;
    canvas.width = Math.min(
      width,
      max
    );
    canvas.height = Math.min(
      height,
      max
    );
    const prefs = getPrefs();

    const c = new C(
      canvas.getContext("webgl", {
        preserveDrawingBuffer:
          location.search.indexOf("nopreserve") > -1 ? false : true,
      })!,
      alea(String(seed)),
    );

    let texture = await c.tile(c.createTexture(prefs.image), {
      scale: prefs.scale,
      srcWidth: prefs.tileX,
      srcHeight: prefs.tileY,
      dstWidth: canvas.width + prefs.distribution * 2,
      dstHeight: canvas.height + prefs.distribution * 2,
    });
    if (prefs.maskTileSize > 0) {
      texture = c.maskTiles(
        texture,
        prefs.tileX * prefs.scale,
        prefs.tileY * prefs.scale,
        prefs.maskTileSize
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
        prefs.brightness
      );
    }
    c.render(texture, {
      srcX: prefs.distribution,
      srcY: -prefs.distribution,
    });
  }

  dom.generate.addEventListener("click", async e => {
    ++seed;
    generate(canvas, window.innerWidth, window.innerHeight)
  });

  dom.generate.click();
}

function readImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      if (image.width === 0 || image.height === 0) {
        reject(new Error(`Unable to get image ${url}`));
        return;
      }
      resolve(image);
    });
    image.addEventListener("error", e => {
      reject(new Error(`Unable to get image ${url}`));
    });
    image.src = url;
    setTimeout(() => {
      reject(new Error(`Unable to get image ${url}`));
    }, 2000);
  });
}

main().catch(e => {
  console.error(e);
})