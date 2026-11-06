/* eslint-env es2021, node */
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { reserveSidebarSpace } from "../src/module/sidebar-clearance.mjs";

function createSidebar(top = 20) {
	const properties = new Map();
	const classes = new Set();
	return {
		getBoundingClientRect: () => ({ top }),
		classList: {
			add: (value) => classes.add(value),
			remove: (value) => classes.delete(value),
			contains: (value) => classes.has(value),
		},
		style: {
			setProperty: (key, value) => properties.set(key, value),
			removeProperty: (key) => properties.delete(key),
			getPropertyValue: (key) => properties.get(key),
		}
	};
}

afterEach(() => {
	delete globalThis.document;
	delete globalThis.window;
	delete globalThis.Hooks;
	delete globalThis.ResizeObserver;
});

test("reserves the measured tray height and equal gaps, and restores the sidebar", () => {
	let sidebar = createSidebar();
	let bounds = { top: 650, bottom: 790, height: 140 };
	let resize;
	let render;
	let observer;
	globalThis.document = { getElementById: () => sidebar };
	globalThis.window = {
		innerHeight: 800,
		addEventListener: (name, callback) => { resize = callback; },
		removeEventListener: (name, callback) => assert.equal(callback, resize),
	};
	globalThis.Hooks = {
		on: (name, callback) => { render = callback; return 42; },
		off: (name, id) => assert.equal(id, 42),
	};
	globalThis.ResizeObserver = class {
		constructor(callback) { this.callback = callback; observer = this; }

		observe(element) { assert.equal(element, tray); }

		disconnect() { this.disconnected = true; }
	};
	const tray = { isConnected: true, getBoundingClientRect: () => bounds };
	const cleanup = reserveSidebarSpace(tray);
	const height = (element) => element.style.getPropertyValue("--dice-tray-sidebar-height");

	assert.equal(height(sidebar), "620px");
	assert.equal(sidebar.classList.contains("dice-tray-sidebar"), true);

	bounds = { top: 610, bottom: 790, height: 180 };
	observer.callback();
	assert.equal(height(sidebar), "580px");

	window.innerHeight = 900;
	bounds = { top: 710, bottom: 890, height: 180 };
	resize();
	assert.equal(height(sidebar), "680px");

	const previous = sidebar;
	sidebar = createSidebar(30);
	render();
	assert.equal(height(previous), undefined);
	assert.equal(previous.classList.contains("dice-tray-sidebar"), false);
	assert.equal(height(sidebar), "670px");

	tray.isConnected = false;
	observer.callback();
	assert.equal(height(sidebar), undefined);
	assert.equal(sidebar.classList.contains("dice-tray-sidebar"), false);

	tray.isConnected = true;
	observer.callback();
	bounds = { top: 20, bottom: 890, height: 870 };
	observer.callback();
	assert.equal(height(sidebar), "0px");

	cleanup();
	assert.equal(observer.disconnected, true);
	assert.equal(height(sidebar), undefined);
	assert.equal(sidebar.classList.contains("dice-tray-sidebar"), false);
});
