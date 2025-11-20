/// <reference path="../types/fresh.d.ts" />

import { VirtualBufferFactory } from "./lib/index.ts";

const MANUAL_MODE = "help-manual";
const SHORTCUTS_MODE = "help-keyboard";
const MANUAL_PANEL_ID = "help-manual-panel";
const SHORTCUTS_PANEL_ID = "help-keyboard-panel";

const createEntriesFromLines = (lines: string[]): TextPropertyEntry[] =>
  lines.map((line) => ({
    text: line.endsWith("\n") ? line : `${line}\n`,
    properties: {},
  }));

const buildManualEntries = (): TextPropertyEntry[] => {
  const manualText = [
    "Fresh Manual",
    "============",
    "",
    "Getting started:",
    "- Open files with the regular explorer or `Ctrl+O`.",
    "- Use the command palette (`Ctrl+P`) to run commands from anywhere.",
    "- Create new files with `Ctrl+N` and save with `Ctrl+S`.",
    "",
    "Navigation & editing:",
    "- Move between buffers with `Ctrl+PageUp` / `Ctrl+PageDown`.",
    "- Split windows using `Ctrl+\\` or the View menu.",
    "- Toggle the file explorer with `Ctrl+B` and focus it with `Tab`.",
    "",
    "Customization & plugins:",
    "- Online docs live in `docs/ARCHITECTURE.md`, `docs/USER_GUIDE.md`,",
    "  and the plugin folder contains TypeScript examples.",
    "- Edit `config.json` to tweak keybindings, menu entries, and theme.",
    "- Plugins can hook into prompts, render hooks, and virtual buffers.",
    "",
    "Need more?",
    "- Read `README.md` for quick start steps.",
    "- See `docs/PLUGIN_DEVELOPMENT.md` for extending Fresh programmatically.",
    "",
    "Press `q` or `Esc` to close this buffer.",
  ];
  return createEntriesFromLines(manualText);
};

const buildShortcutEntries = (bindings: { key: string; action: string }[]): TextPropertyEntry[] => {
  const header = [
    "Keyboard Shortcuts",
    "===================",
    "",
  ];
  const lines: string[] = bindings.map((binding) => {
    const keyLabel = binding.key.padEnd(22);
    return `${keyLabel} ${binding.action}`;
  });
  const paddedLines = lines.length ? lines : ["(No bindings available)"];
  return createEntriesFromLines([...header, ...paddedLines, "", "Press `q` or `Esc` to close."]);
};

const openVirtualBuffer = async (
  name: string,
  entries: TextPropertyEntry[],
  mode: string,
  panelId: string,
): Promise<void> => {
  try {
    await VirtualBufferFactory.createWithSplit({
      name,
      mode,
      entries,
      ratio: 0.35,
      panelId,
      showLineNumbers: false,
      editingDisabled: true,
      readOnly: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    editor.setStatus(`Failed to open ${name}: ${message}`);
  }
};

const openManual = async (): Promise<void> => {
  const entries = buildManualEntries();
  await openVirtualBuffer("*Fresh Manual*", entries, MANUAL_MODE, MANUAL_PANEL_ID);
};

const openShortcuts = async (bindings: { key: string; action: string }[]): Promise<void> => {
  const entries = buildShortcutEntries(bindings);
  await openVirtualBuffer(
    "*Keyboard Shortcuts*",
    entries,
    SHORTCUTS_MODE,
    SHORTCUTS_PANEL_ID,
  );
};

editor.defineMode(
  MANUAL_MODE,
  null,
  [
    ["q", "manual_help_close"],
    ["Escape", "manual_help_close"],
  ],
  true,
);

editor.defineMode(
  SHORTCUTS_MODE,
  null,
  [
    ["q", "manual_help_close"],
    ["Escape", "manual_help_close"],
  ],
  true,
);

globalThis.manual_help_close = () => {
  const bufferId = editor.getActiveBufferId();
  editor.closeBuffer(bufferId);
};

globalThis.onManualPage = async (): Promise<boolean> => {
  await openManual();
  return true;
};

globalThis.onKeyboardShortcuts = async (args: {
  bindings: { key: string; action: string }[];
}): Promise<boolean> => {
  await openShortcuts(args.bindings);
  return true;
};

editor.on("manual_page", "onManualPage");
editor.on("keyboard_shortcuts", "onKeyboardShortcuts");

editor.registerCommand(
  "Show Fresh Manual",
  "Open the Fresh manual (virtual buffer)",
  "show_help",
  "normal",
);

editor.registerCommand(
  "Keyboard Shortcuts",
  "Show the keyboard shortcuts list (virtual buffer)",
  "keyboard_shortcuts",
  "normal",
);

editor.debug("Manual/help plugin initialized");
