import * as tools from "./jslib/tools.js";
import { C } from "./jslib/ctools.js";
import * as filters from "./jslib/filters.js";

function getImages() {
	return fetch("./api/list.php").then(req => req.json());
}

async function readImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => {
			resolve(image);
		});
		image.src = url;
	});
}

function getShaders() {
	return fetch("./api/shaders.php").then(req => req.json());
}

function getShader(name) {
	return fetch(`./shaders/${name}.glslx`).then(req => {
		if (req.status < 200 || req.status >= 400)
			throw new Error(`request failed with code ${req.status}`);
		return req.text();
	});
}

async function main() {
	const canvas = document.querySelector("canvas");
	const c = new C(
		canvas.getContext("webgl", {
			// preserveDrawingBuffer: true,
		})
	);
	const images = await getImages();

	const winput = document.querySelector(".winput");
	const hinput = document.querySelector(".hinput");
	const zinput = document.querySelector(".zinput");
	const txinput = document.querySelector(".txinput");
	const tyinput = document.querySelector(".tyinput");
	const sel = document.querySelector(".src");
	const appliedFilters = document.querySelector(".applied-filters");
	const filterStack = document.querySelector(".filter-stack");
	const actionSel = document.querySelector(".action");
	const genb = document.querySelector(".genb");
	const difb = document.querySelector(".difb");
	const fire = tools.debounce(() => {
		genb.click();
	}, 500);

	[winput, hinput, zinput, txinput, tyinput].forEach(e => {
		e.addEventListener("keydown", e => {
			if (e.which === 71) e.preventDefault();
			if (e.which === 13) {
				genb.click();
			}
		});
	});

	document.addEventListener("keydown", e => {
		// 71 is g
		if (e.which === 71) genb.click();
	});

	images.forEach(src => {
		const opt = document.createElement("option");
		opt.innerText = src;
		sel.appendChild(opt);
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
				appliedFilters.removeChild(el);
			});
			appliedFilters.appendChild(el);
		});
		filterStack.appendChild(opt);
	});

	genb.addEventListener("click", async e => {
		canvas.width = parseInt(winput.value, 10) || window.innerWidth;
		canvas.height = parseInt(hinput.value, 10) || window.innerHeight;
		const image = await readImage(sel.options[sel.selectedIndex].text);
		c.clear();
		switch (actionSel.options[actionSel.selectedIndex].text) {
			case "Tile":
				const tile = await c.tile(image, {
					scale: 1 / (parseInt(zinput.value, 10) || 1),
					srcWidth: parseInt(txinput.value, 10),
					srcHeight: parseInt(tyinput.value, 10),
					effects: Array.from(appliedFilters.childNodes)
						.map(x => x.innerText)
						.map(x => filters[x]),
				});
				c.render(tile, canvas.width, canvas.height, true);
				break;
			case "Image":
				c.drawImage(image, {
					scale: 1 / (parseInt(zinput.value, 10) || 1),
					srcWidth: parseInt(txinput.value, 10),
					srcHeight: parseInt(tyinput.value, 10),
				});
				break;
		}
	});

	document.body.addEventListener("dragover", e => {
		e.preventDefault();
	});

	document.body.addEventListener("drop", e => {
		e.preventDefault();
		if (!e.dataTransfer.files[0]) return;
		console.log(e.dataTransfer.files[0]);
	});
}

main().catch(e => console.error(e));
