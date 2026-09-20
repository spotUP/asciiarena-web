// @vitest-environment jsdom
//
// Reported three times now -- July, 2026-08-25, and again on 2026-09-19:
//
//   "There seems to be a glitch with the colly upload page. I've tried to add
//    my new colly but after numerous attempts, it's been wiping out the artist
//    crew info?"                                          -- FuZioN, 2026-09-19
//   "Yeah I had to edit the collies after upload and add authors and groups
//    again."                                              -- GOTO80, 2026-09-19
//
// Both earlier fixes were real (a blur commit in lib/combobox-commit.ts, then
// hoisting MultiSelect to module scope so React stopped remounting the field),
// and both shipped tests that only read the SOURCE -- "the file contains a
// blur handler", "MultiSelect is declared before SubmitClient". Assertions like
// that pass just as happily on a form that still drops what you typed.
//
// So this mounts the real Combobox in the shape SubmitClient uses it, drives
// the events a browser actually sends, and asserts on the values the submit
// handler would put into the FormData. If a name can be lost between the
// keyboard and the POST, one of these fails.

import { act } from "react";
import { createElement, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Combobox from "@/components/ui/Combobox";

const ARTISTS = ["Spot", "Sixx", "GOTO80"];

let container: HTMLDivElement;
let root: Root;
/**
 * What handleCollySubmit would append at this moment.
 *
 * A property on a shared object rather than a bare `let`: the react-hooks rule
 * (rightly) refuses a component that reassigns a variable from an outer scope.
 */
const posted: {
  artistname: string[] | null;
  both: { artists: string[]; crews: string[] } | null;
} = { artistname: null, both: null };

/**
 * The colly form's artist field, reduced to the part under test: a Combobox
 * whose value lives in the page's state, and a submit button whose handler
 * reads that state -- exactly the shape of SubmitClient's MultiSelect plus
 * handleCollySubmit.
 */
function Harness({ initial = [""] }: { initial?: string[] }): ReactNode {
  const [values, setValues] = useState<string[]>(initial);
  return createElement(
    "form",
    {
      onSubmit: (e: React.FormEvent) => {
        e.preventDefault();
        // The line from handleCollySubmit that builds the payload.
        posted.artistname = values.filter(Boolean);
      },
    },
    createElement(Combobox, {
      value: values[0],
      options: ARTISTS.map(o => ({ value: o, label: o })),
      createLabel: "artist",
      placeholder: "-- Unknown --",
      onChange: (v: string) => setValues(prev => [v, ...prev.slice(1)]),
    }),
    createElement("input", { type: "submit", value: "Submit", id: "submit" }),
  );
}

/** The artist and crew fields together, each owning its own state. */
function TwoFieldHarness(): ReactNode {
  const [artists, setArtists] = useState<string[]>([""]);
  const [crews, setCrews] = useState<string[]>([""]);
  return createElement(
    "form",
    {
      onSubmit: (e: React.FormEvent) => {
        e.preventDefault();
        posted.both = { artists: artists.filter(Boolean), crews: crews.filter(Boolean) };
      },
    },
    createElement(Combobox, {
      value: artists[0],
      options: ARTISTS.map(o => ({ value: o, label: o })),
      createLabel: "artist",
      onChange: (v: string) => setArtists(prev => [v, ...prev.slice(1)]),
    }),
    createElement(Combobox, {
      value: crews[0],
      options: [{ value: "Up Rough", label: "Up Rough" }],
      createLabel: "crew",
      onChange: (v: string) => setCrews(prev => [v, ...prev.slice(1)]),
    }),
    createElement("input", { type: "submit", value: "Submit", id: "submit" }),
  );
}

function input(): HTMLInputElement {
  const el = container.querySelector<HTMLInputElement>('input[type="text"]');
  if (!el) throw new Error("no combobox input");
  return el;
}

/**
 * Type into the field the way a person does: focus, then a character at a time.
 *
 * The value goes in through the prototype's own setter. React keeps a private
 * tracker of what it last wrote to an input and ignores an `input` event whose
 * value matches it, so a plain `el.value = x` is swallowed and the component
 * under test never sees a keystroke -- a test harness that quietly types
 * nothing would "prove" any bug you like.
 */
const nativeValue = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value",
)!.set!;

async function type(text: string): Promise<void> {
  await typeInto(input(), text);
}

async function typeInto(el: HTMLInputElement, text: string): Promise<void> {
  await act(async () => {
    el.focus();
    el.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  });
  for (const ch of text) {
    await act(async () => {
      nativeValue.call(el, el.value + ch);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
}

/**
 * Click an element the way a browser does: mousedown (which moves focus off
 * whatever had it, firing blur), then mouseup, then click.
 *
 * The order is the whole point. The combobox commits what you typed on blur,
 * and blur happens on MOUSEDOWN -- before the click that submits. A test that
 * only dispatches `click` never exercises the sequence that loses the name.
 */
async function realClick(el: HTMLElement): Promise<void> {
  const focused = document.activeElement as HTMLElement | null;
  await act(async () => {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    if (focused && focused !== el) {
      focused.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      focused.blur();
    }
  });
  await act(async () => {
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  posted.artistname = null;
  posted.both = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("an artist typed into the colly form reaches the POST", () => {
  it("survives typing a brand-new name and clicking Submit", async () => {
    await act(async () => { root.render(createElement(Harness)); });
    await type("FuZioN");
    await realClick(container.querySelector<HTMLInputElement>("#submit")!);
    // This is the whole bug: the name is in the field, the reader pressed the
    // button, and artistname[] went out empty.
    expect(posted.artistname).toEqual(["FuZioN"]);
  });

  it("survives a name that already exists in the list", async () => {
    await act(async () => { root.render(createElement(Harness)); });
    await type("Sixx");
    await realClick(container.querySelector<HTMLInputElement>("#submit")!);
    expect(posted.artistname).toEqual(["Sixx"]);
  });

  it("uses the list's spelling when the typing differs in case", async () => {
    await act(async () => { root.render(createElement(Harness)); });
    await type("goto80");
    await realClick(container.querySelector<HTMLInputElement>("#submit")!);
    // Otherwise "goto80" creates a second artist next to "GOTO80".
    expect(posted.artistname).toEqual(["GOTO80"]);
  });

  it("survives picking the name from the drop-down", async () => {
    await act(async () => { root.render(createElement(Harness)); });
    await type("Sp");
    const option = [...container.querySelectorAll("button")].find(b => b.textContent === "Spot");
    expect(option, "the drop-down should offer Spot").toBeTruthy();
    await act(async () => {
      option!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    await realClick(container.querySelector<HTMLInputElement>("#submit")!);
    expect(posted.artistname).toEqual(["Spot"]);
  });

  it("survives confirming the name with Enter", async () => {
    await act(async () => { root.render(createElement(Harness)); });
    await type("Sixx");
    await act(async () => {
      input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    await realClick(container.querySelector<HTMLInputElement>("#submit")!);
    expect(posted.artistname).toEqual(["Sixx"]);
  });

  it("survives a browser that does not blur the field when a button is clicked", async () => {
    // The one that bit three people. Chromium moves focus to a button on
    // mousedown, so blur fires and the typed name is committed. Safari and iOS
    // deliberately do NOT focus a button on click: the text field keeps focus,
    // no blur is ever dispatched, and a design that only commits on blur posts
    // the state from before the reader typed anything.
    //
    // So: type, then submit the form WITHOUT any focus event at all.
    await act(async () => { root.render(createElement(Harness)); });
    await type("FuZioN");
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(posted.artistname).toEqual(["FuZioN"]);
  });

  it("keeps both fields when the artist and the crew are typed in turn", async () => {
    // What the reader actually does: type a name, type a crew, hit Submit --
    // and on Safari nothing is ever blurred along the way.
    await act(async () => { root.render(createElement(TwoFieldHarness)); });
    const [artist, crew] = [...container.querySelectorAll<HTMLInputElement>('input[type="text"]')];
    await typeInto(artist, "FuZioN");
    await typeInto(crew, "Demo");
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(posted.both).toEqual({ artists: ["FuZioN"], crews: ["Demo"] });
  });

  it("still sends nothing when the field was left alone", async () => {
    await act(async () => { root.render(createElement(Harness)); });
    await realClick(container.querySelector<HTMLInputElement>("#submit")!);
    expect(posted.artistname).toEqual([]);
  });
});
