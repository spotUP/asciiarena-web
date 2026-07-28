/**
 * bootstrap.js — embedded-editor boot sequence.
 *
 * Trimmed/adapted from upstream text0wnz `main.js`. Differences from upstream:
 *   (a) No service-worker registration, PWA launchQueue, share-target, or iOS
 *       chrome handling (those are PWA-only concerns the embed does not need).
 *   (b) No Vite `import '../../css/...'` / `import '../../img/...'` asset
 *       imports (the CSS is loaded by the React layer; images are inlined).
 *   (c) Exposes `bootstrapEditor(rootEl, opts)` instead of self-invoking on
 *       `DOMContentLoaded`. The UI markup is already in the document (injected
 *       by mount.ts), so element lookups still go through `getElementById`.
 *   (d) Every document-level listener it registers (keydown, save listeners,
 *       drag/drop) is recorded and removed by the returned teardown function,
 *       and drawing/keyboard listeners are gated so they only fire while the
 *       editor root is hovered/focused.
 *   (e) The `document.title` hijack is neutralized in state.js (see comment
 *       there) — the embed must not clobber the host page title.
 *   (f) The canvas is locked to a caller-provided size (default 80x10) and the
 *       Topaz+ font; the resize ("resolution") UI is hidden.
 *
 * Returns a teardown function that detaches listeners, cancels timers, and
 * resets the shared `State` singleton so a remount (e.g. React StrictMode) is
 * clean.
 */

import magicNumbers from './magicNumbers.js';
import State from './state.js';
import Toolbar from './toolbar.js';
import { Load, Save } from './file.js';
import { createTextArtCanvas } from './canvas.js';
import { createWorkerHandler, createChatController } from './network.js';
import { FontCache } from './fontCache.js';
import {
	$,
	$$,
	$$$,
	createDragDropController,
	createModalController,
	createSettingToggle,
	onClick,
	onReturn,
	onFileChange,
	createPositionInfo,
	undoAndRedo,
	viewportTap,
	createPaintShortcuts,
	createViewportController,
	createGenericController,
	createResolutionController,
	createGrid,
	createToolPreview,
	createMenuController,
	enforceMaxBytes,
	createFontSelect,
	createZoomControl,
} from './ui.js';
import {
	createDefaultPalette,
	createPalettePreview,
	createPalettePicker,
} from './palette.js';
import {
	createCursor,
	createSelectionCursor,
	createSelectionTool,
	createKeyboardController,
	createPasteTool,
} from './keyboard.js';

/**
 * Boot the embedded ANSI editor against markup already present in the document.
 *
 * @param {HTMLElement} rootEl - the `.ansi-editor-root` wrapper holding the UI.
 * @param {{ columns?: number, rows?: number, font?: string, iceColors?: boolean, onReady?: () => void }} [opts]
 * @returns {() => void} teardown
 */
export function bootstrapEditor(rootEl, opts = {}) {
	const columns = opts.columns ?? 80;
	const rows = opts.rows ?? 8;
	const fontName = opts.font ?? 'Topaz+ 1200 8x16';
	const iceColors = opts.iceColors ?? true;

	// --- teardown bookkeeping ---------------------------------------------
	/** @type {Array<() => void>} */
	const disposers = [];
	let saveTimeout = null;
	let destroyed = false;

	/**
	 * addDocListener — register a document-level listener and remember how to
	 * remove it. `gated` listeners only run while the editor root is the active
	 * region (hovered or contains the focused element), so global keyboard
	 * shortcuts don't fire while the user is interacting with the rest of the
	 * asciiarena page.
	 */
	const addDocListener = (type, handler, gated = false) => {
		const wrapped = gated
			? e => {
					if (!editorIsActive()) return;
					handler(e);
				}
			: handler;
		document.addEventListener(type, wrapped);
		disposers.push(() => document.removeEventListener(type, wrapped));
	};

	// Kept for any hover-sensitive engine behaviour; no longer gates keyboard.
	let hovered = false;
	const onEnter = () => {
		hovered = true;
	};
	const onLeave = () => {
		hovered = false;
	};
	rootEl.addEventListener('pointerenter', onEnter);
	rootEl.addEventListener('pointerleave', onLeave);
	disposers.push(() => {
		rootEl.removeEventListener('pointerenter', onEnter);
		rootEl.removeEventListener('pointerleave', onLeave);
	});
	// asciiarena CHANGE: focus decides who gets the keyboard, not hover.
	//
	// This used to return true whenever the pointer was merely over the editor,
	// so resting the mouse on the canvas while typing in the page's own Title
	// field sent those keystrokes into the drawing instead. Hovering is not a
	// statement of intent; focus is. The root is focusable (see mount.ts) and
	// takes focus on pointerdown, so clicking the canvas hands the keyboard over
	// explicitly and clicking back into a form field hands it back.
	const editorIsActive = () =>
		document.activeElement != null && rootEl.contains(document.activeElement);

	// --- begin boot --------------------------------------------------------
	FontCache.preloadCommonFonts();
	State.startInitialization();

	const bodyContainer = $('bodyContainer');
	const canvasContainer = $('canvasContainer');
	const viewport = $('viewport');
	const openFile = $('openFile');

	State.modal = createModalController($('modal'));
	State.palette = createDefaultPalette();
	State.pasteTool = createPasteTool($('cut'), $('copy'), $('paste'), $('delete'));

	let palettePicker;

	const openHandler = file => {
		bodyContainer.classList.add('loading');
		State.textArtCanvas.clearXBData();
		State.textArtCanvas.clear();
		Load.file(
			file,
			async (cols, rws, imageData, ice, letterSpacing, loadedFontName) => {
				const dot = file.name.lastIndexOf('.');
				State.title = dot !== -1 ? file.name.substring(0, dot) : file.name;
				bodyContainer.classList.remove('loading');

				const applyData = () => {
					// asciiarena: import INTO the canvas the composer mounted rather
					// than resizing to the dropped file. A forum post and a site logo
					// are fixed sizes -- the post box reserves exactly the canvas
					// height and the logo must stay 80x10 -- so setImageData's resize
					// broke the layout and, for logos, produced an invalid size.
					// setArea already clips to the canvas, so anything past the edges
					// is dropped. startUndo makes the import undoable like any edit.
					State.textArtCanvas.startUndo();
					State.textArtCanvas.setArea(
						{ width: cols, height: rws, data: imageData },
						0,
						0,
					);
					palettePicker.updatePalette();
					openFile.value = '';
					viewport.scrollLeft = viewport.scrollTop = 0;
					// setImageData used to fire this; the listeners persist the canvas
					// and redraw the glyph pickers, and still need to run.
					document.dispatchEvent(new CustomEvent('onOpenedFile'));
				};
				const closeModal = () => {
					if (State.modal.isOpen() && State.modal.current === 'loading') {
						State.modal.close();
					}
				};
				const isSceneFile =
					file.name.toLowerCase().endsWith('.nfo') ||
					file.name.toLowerCase().endsWith('.diz');
				if (isSceneFile) {
					await State.textArtCanvas.setFont(magicNumbers.NFO_FONT, applyData);
					return;
				}
				const isXBFile = file.name.toLowerCase().endsWith('.xb');
				if (loadedFontName && !isXBFile) {
					const appFontName = Load.sauceToAppFont(loadedFontName.trim());
					if (appFontName) {
						await State.textArtCanvas.setFont(appFontName, applyData);
						closeModal();
						return;
					}
				}
				applyData();
				palettePicker.updatePalette();
				closeModal();
			},
		);
	};

	const save = () => {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			State.saveToLocalStorage();
			saveTimeout = null;
		}, 300);
	};

	// Create canvas; the rest of the UI is wired once it's minimally ready.
	State.textArtCanvas = createTextArtCanvas(canvasContainer, () => {
		bodyContainer.classList.remove('loading');
		setTimeout(() => {
			if (destroyed) return;
			State.positionInfo = createPositionInfo($('positionInfo'));
			State.selectionCursor = createSelectionCursor(canvasContainer);
			State.cursor = createCursor(canvasContainer);
			State.selectionTool = createSelectionTool();

			const zoomControlContainer = $('zoomControl');
			if (zoomControlContainer) {
				zoomControlContainer.appendChild(createZoomControl());
			}

			const initSecondaryTools = () => {
				if (destroyed) return;
				State.toolPreview = createToolPreview($('toolPreview'));
				State.title = 'Untitled';
				State.waitFor(
					[
						'palette',
						'textArtCanvas',
						'font',
						'modal',
						'cursor',
						'selectionCursor',
						'selectionTool',
						'positionInfo',
						'toolPreview',
						'pasteTool',
					],
					async () => {
						if (destroyed) return;
						await initializeAppComponents();
					},
				);
			};
			if ('requestIdleCallback' in window) {
				requestIdleCallback(initSecondaryTools);
			} else {
				setTimeout(initSecondaryTools, 100);
			}
		}, 0);
	});

	const initializeAppComponents = async () => {
		// Lock the canvas to the embed size + font instead of restoring
		// localStorage (the embed always starts from a fixed blank surface).
		await State.textArtCanvas.setFont(fontName, () => {
			State.font.setLetterSpacing(false);
			State.textArtCanvas.resize(columns, rows);
			State.textArtCanvas.clear();
			State.textArtCanvas.setIceColors(iceColors);
		});

		// Hide the resolution / resize UI — the embed canvas size is fixed.
		const resolution = $('resolution');
		if (resolution) resolution.style.display = 'none';

		addDocListener('keydown', undoAndRedo, true);
		createResolutionController(
			$('resolutionLabel'),
			$('columnsInput'),
			$('rowsInput'),
		);
		State.menus = createMenuController(
			[
				{ button: $('fileMenu'), menu: $('fileList') },
				{ button: $('editMenu'), menu: $('editList') },
			],
			canvasContainer,
			viewport,
		);

		onClick($('new'), () => State.modal.open('warning'));
		onClick($('warningYes'), async () => {
			bodyContainer.classList.add('loading');
			State.textArtCanvas.clearXBData(async () => {
				State.palette = createDefaultPalette();
				palettePicker.updatePalette();
				palettePreview.updatePreview();
				await State.textArtCanvas.setFont(fontName, () => {
					State.font.setLetterSpacing(false);
					State.textArtCanvas.resize(columns, rows);
					State.textArtCanvas.clear();
					State.textArtCanvas.setIceColors(iceColors);
					bodyContainer.classList.remove('loading');
					State.modal.close();
				});
			});
		});
		onClick($('saveAnsi'), Save.ans);
		onClick($('saveUtf8'), Save.utf8);
		onClick($('savePlaintext'), Save.plainText);
		onClick($('saveBin'), Save.bin);
		onClick($('saveXbin'), Save.xb);
		onClick($('savePng'), Save.png);
		onClick($('cut'), State.pasteTool.cut);
		onClick($('copy'), State.pasteTool.copy);
		onClick($('paste'), State.pasteTool.paste);
		onClick($('systemPaste'), State.pasteTool.systemPaste);
		onClick($('delete'), State.pasteTool.deleteSelection);
		onClick($('navCut'), State.pasteTool.cut);
		onClick($('navCopy'), State.pasteTool.copy);
		onClick($('navPaste'), State.pasteTool.paste);
		onClick($('navSystemPaste'), State.pasteTool.systemPaste);
		onClick($('navDelete'), State.pasteTool.deleteSelection);
		onClick($('navUndo'), State.textArtCanvas.undo);
		onClick($('navRedo'), State.textArtCanvas.redo);

		// asciiarena: the About / Help menu items are gone (see markup.ts), so
		// nothing opens these any more. The modal markup stays because the modal
		// registry in ui.js looks every dialog up by id at startup.
		onClick($('aboutDl'), () => {
			window.open(
				'https://github.com/xero/text0wnz/releases/latest',
				'_blank',
			);
		});
		onClick($('aboutPrivacy'), () => {
			window.open(
				'https://github.com/xero/teXt0wnz/blob/main/docs/privacy.md',
				'_blank',
			);
		});
		const palettePreview = createPalettePreview($('palettePreview'));
		palettePicker = createPalettePicker($('palettePicker'));

		onFileChange(openFile, openHandler);
		createDragDropController(openHandler, $('dragdrop'));

		onClick($('navSauce'), () => {
			State.menus.close();
			State.modal.open('sauce');
		});
		const sauceTitle = $('sauceTitle');
		const sauceDone = $('sauceDone');
		onClick(sauceDone, () => {
			State.title = sauceTitle.value;
			State.modal.close();
		});
		$('sauceComments').addEventListener('input', enforceMaxBytes);
		onReturn(sauceTitle, sauceDone);
		onReturn($('sauceGroup'), sauceDone);
		onReturn($('sauceAuthor'), sauceDone);
		onReturn($('sauceComments'), sauceDone);

		const swapColors = $('swapColors');
		const paintShortcuts = createPaintShortcuts({
			d: $('defaultColor'),
			q: swapColors,
			k: $('keyboard'),
			f: $('brushes'),
			b: $('characterBrush'),
			n: $('fill'),
			a: $('attrib'),
			g: $('navGrid'),
			i: $('navICE'),
			m: $('mirror'),
		});
		const keyboard = createKeyboardController();
		Toolbar.add(
			$('keyboard'),
			() => {
				paintShortcuts.disable();
				State.menus.close();
				keyboard.enable();
				$('keyboardToolbar').classList.remove('hide');
			},
			() => {
				paintShortcuts.enable();
				keyboard.disable();
				State.menus.close();
				$('keyboardToolbar').classList.add('hide');
			},
		).enable();
		Toolbar.add(
			$('selection'),
			() => {
				paintShortcuts.disable();
				State.menus.close();
				State.selectionTool.enable();
				$('selectionToolbar').classList.remove('hide');
			},
			() => {
				paintShortcuts.enable();
				State.selectionTool.disable();
				$('selectionToolbar').classList.add('hide');
			},
		);

		onClick($('undo'), State.textArtCanvas.undo);
		onClick($('redo'), State.textArtCanvas.redo);
		// The resolution/resize modal is intentionally not wired — fixed size.

		onClick($('insertRow'), keyboard.insertRow);
		onClick($('deleteRow'), keyboard.deleteRow);
		onClick($('insertColumn'), keyboard.insertColumn);
		onClick($('deleteColumn'), keyboard.deleteColumn);
		onClick($('eraseRow'), keyboard.eraseRow);
		onClick($('eraseRowStart'), keyboard.eraseToStartOfRow);
		onClick($('eraseRowEnd'), keyboard.eraseToEndOfRow);
		onClick($('eraseColumn'), keyboard.eraseColumn);
		onClick($('eraseColumnStart'), keyboard.eraseToStartOfColumn);
		onClick($('eraseColumnEnd'), keyboard.eraseToEndOfColumn);

		onClick($('defaultColor'), () => {
			State.palette.setForegroundColor(7);
			State.palette.setBackgroundColor(0);
		});
		onClick(swapColors, () => {
			const tmp = State.palette.getForegroundColor();
			State.palette.setForegroundColor(State.palette.getBackgroundColor());
			State.palette.setBackgroundColor(tmp);
		});
		onClick($('palettePreview'), () => {
			const tmp = State.palette.getForegroundColor();
			State.palette.setForegroundColor(State.palette.getBackgroundColor());
			State.palette.setBackgroundColor(tmp);
		});

		const navICE = createSettingToggle(
			$('navICE'),
			State.textArtCanvas.getIceColors,
			newIce => State.textArtCanvas.setIceColors(newIce),
		);
		const nav9pt = createSettingToggle(
			$('nav9pt'),
			State.font.getLetterSpacing,
			newLetterSpacing => State.font.setLetterSpacing(newLetterSpacing),
		);

		const fontSelect = createFontSelect(
			$('fontSelect'),
			$('fontPreviewInfo'),
			$('fontPreviewImage'),
			$('fontsApply'),
		);
		const fontDisplay = $$('#currentFontDisplay kbd');
		const updateFontDisplay = () => {
			const currentFont = State.textArtCanvas.getCurrentFontName();
			if (fontDisplay) {
				fontDisplay.textContent = currentFont.replace(/\s\d+x\d+$/, '');
			}
			fontSelect.setValue(currentFont);
			nav9pt.sync(State.font.getLetterSpacing, State.font.setLetterSpacing);
			navICE.update();
		};
		const fontDisplayEvents = [
			'onPaletteChange',
			'onFontChange',
			'onXBFontLoaded',
			'onOpenedFile',
		];
		fontDisplayEvents.forEach(e => addDocListener(e, updateFontDisplay));
		// asciiarena CHANGE: the text0wnz font MODAL is replaced by the React
		// DosSelect font picker (see AnsiEditor.tsx). Do NOT wire the click
		// handlers that open `#fontsModal` — the font display chip and the
		// in-toolbar "Change Font" button are inert here (and hidden in CSS), so
		// the only font UI is the DosSelect. The list/preview machinery above
		// (createFontSelect, updateFontDisplay) is kept so onFontChange events
		// still sync the header chip text in case it's ever shown.
		onClick($('fontsApply'), async () => {
			const selectedFont = fontSelect.getValue();
			await State.textArtCanvas.setFont(selectedFont, () => State.modal.close());
		});

		const grid = createGrid($('grid'));
		createSettingToggle($('navGrid'), grid.isShown, grid.show);

		Toolbar.addLazy($('brushes'), async () => {
			const { createBrushController } = await import('./freehandTools.js');
			const brushes = createBrushController();
			return {
				onFocus: brushes.enable,
				onBlur: brushes.disable,
				enable: brushes.enable,
			};
		});
		Toolbar.addLazy($('halfblock'), async () => {
			const { createHalfBlockController } = await import('./freehandTools.js');
			const halfblock = createHalfBlockController();
			return {
				onFocus: halfblock.enable,
				onBlur: halfblock.disable,
				enable: halfblock.enable,
			};
		});

		let shadeBrush = null;
		let characterBrush = null;
		const ensureBrushesLoaded = async () => {
			if (!shadeBrush) {
				const { createShadingController, createShadingPanel } = await import(
					'./freehandTools.js'
				);
				shadeBrush = createShadingController(await createShadingPanel(), false);
			}
			if (!characterBrush) {
				const { createShadingController, createCharacterBrushPanel } =
					await import('./freehandTools.js');
				characterBrush = createShadingController(
					await createCharacterBrushPanel(),
					true,
				);
			}
			return { shadeBrush, characterBrush };
		};

		Toolbar.addLazy($('shadingBrush'), async () => {
			await ensureBrushesLoaded();
			return {
				onFocus: shadeBrush.enable,
				onBlur: shadeBrush.disable,
				enable: shadeBrush.enable,
				ignore: shadeBrush.ignore,
				unignore: shadeBrush.unignore,
			};
		});
		Toolbar.addLazy($('characterBrush'), async () => {
			await ensureBrushesLoaded();
			return {
				onFocus: characterBrush.enable,
				onBlur: characterBrush.disable,
				enable: characterBrush.enable,
				ignore: characterBrush.ignore,
				unignore: characterBrush.unignore,
			};
		});
		Toolbar.addLazy($('fill'), async () => {
			const { createFillController } = await import('./freehandTools.js');
			const fill = createFillController();
			return { onFocus: fill.enable, onBlur: fill.disable, enable: fill.enable };
		});
		Toolbar.addLazy($('attrib'), async () => {
			const { createAttributeBrushController } = await import(
				'./freehandTools.js'
			);
			const attributeBrush = createAttributeBrushController();
			$('attribSize').addEventListener('change', e => {
				attributeBrush.setBrushSize(parseInt(e.target.value, 10));
			});
			return {
				onFocus: attributeBrush.enable,
				onBlur: attributeBrush.disable,
				enable: attributeBrush.enable,
			};
		});
		Toolbar.addLazy($('shapes'), async () => {
			const { createShapesController } = await import('./freehandTools.js');
			const shapes = createShapesController();
			return {
				onFocus: shapes.enable,
				onBlur: shapes.disable,
				enable: shapes.enable,
			};
		});
		Toolbar.addLazy($('line'), async () => {
			const { createLineController } = await import('./freehandTools.js');
			const line = createLineController();
			return { onFocus: line.enable, onBlur: line.disable, enable: line.enable };
		});
		Toolbar.addLazy($('square'), async () => {
			const { createSquareController } = await import('./freehandTools.js');
			const square = createSquareController();
			return {
				onFocus: square.enable,
				onBlur: square.disable,
				enable: square.enable,
			};
		});
		Toolbar.addLazy($('circle'), async () => {
			const { createCircleController } = await import('./freehandTools.js');
			const circle = createCircleController();
			return {
				onFocus: circle.enable,
				onBlur: circle.disable,
				enable: circle.enable,
			};
		});

		const fonts = createGenericController($('fontToolbar'), $('fonts'));
		Toolbar.add($('fonts'), fonts.enable, fonts.disable);
		const clipboard = createGenericController(
			$('clipboardToolbar'),
			$('clipboard'),
		);
		const view = createViewportController($('viewportToolbar'));
		Toolbar.add($('navView'), view.enable, view.disable);
		Toolbar.add($('clipboard'), clipboard.enable, clipboard.disable);

		Toolbar.addLazy($('sample'), async () => {
			const { createSampleTool } = await import('./freehandTools.js');
			await ensureBrushesLoaded();
			State.sampleTool = await createSampleTool(
				shadeBrush,
				$('shadingBrush'),
				characterBrush,
				$('characterBrush'),
			);
			return {
				onFocus: State.sampleTool.enable,
				onBlur: State.sampleTool.disable,
				enable: State.sampleTool.enable,
			};
		});

		createSettingToggle(
			$('mirror'),
			State.textArtCanvas.getMirrorMode,
			State.textArtCanvas.setMirrorMode,
		);

		State.modal.focusEvents(
			() => {
				keyboard.ignore();
				paintShortcuts.ignore();
				if (shadeBrush && shadeBrush.ignore) shadeBrush.ignore();
				if (characterBrush && characterBrush.ignore) characterBrush.ignore();
			},
			() => {
				keyboard.unignore();
				paintShortcuts.unignore();
				if (shadeBrush && shadeBrush.unignore) shadeBrush.unignore();
				if (characterBrush && characterBrush.unignore)
					characterBrush.unignore();
			},
		);

		updateFontDisplay();
		viewportTap(viewport);

		// Chat + network are no-op stubs in the embed (collaboration is a later
		// sub-project), but we still wire the controllers so the toggle exists.
		State.chat = createChatController();
		State.network = createWorkerHandler();

		// Persist editor state to localStorage on the same events upstream does.
		addDocListener('onTextCanvasUp', save);
		addDocListener('keypress', save, true);
		addDocListener('onFontChange', save);
		addDocListener('onPaletteChange', save);
		addDocListener('onLetterSpacingChange', save);
		addDocListener('onIceColorsChange', save);
		addDocListener('onOpenedFile', save);

		opts.onReady?.();
	};

	/**
	 * load — replace the canvas contents from raw .ans bytes. Reuses the same
	 * code path as the file-open menu so font/ice/SAUCE handling is identical.
	 * @param {Uint8Array} bytes
	 */
	const load = bytes => {
		if (destroyed || !State.textArtCanvas) return;
		const file = new File([bytes], 'untitled.ans', {
			type: 'application/octet-stream',
		});
		openHandler(file);
	};

	// --- teardown ----------------------------------------------------------
	const teardown = function teardown() {
		if (destroyed) return;
		destroyed = true;
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		disposers.forEach(dispose => {
			try {
				dispose();
			} catch {
				/* best-effort cleanup */
			}
		});
		disposers.length = 0;
		try {
			Toolbar.reset?.();
		} catch {
			/* Toolbar may not expose reset; ignore */
		}
		// Reset the shared singleton so a remount starts clean.
		try {
			State.reset();
		} catch {
			/* ignore */
		}
	};

	return { teardown, load };
}
