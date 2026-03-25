import { useState, useEffect, useRef } from "react";
import "./App.css";
import Editor from "@monaco-editor/react";
import "@fontsource/jetbrains-mono";
import { BaseDirectory, writeTextFile, readTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { X, Minimize, Expand } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const TABS_META_FILE = "aether/tabs.json";
const TEMP_DIR = "aether/temp";

const appWindow = getCurrentWindow();

const caretTheme = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "d4894a" },
    { token: "string", foreground: "8fa87a" },
    { token: "number", foreground: "c47a3a" },
    { token: "comment", foreground: "4a3e36", fontStyle: "italic" },
    { token: "type", foreground: "d4894a", fontStyle: "italic" },
    { token: "identifier", foreground: "c8a882" },
    { token: "function", foreground: "e8b86d" },
    { token: "variable", foreground: "b8956a" },
  ],
  colors: {
    "editor.background": "#050504",
    "editor.foreground": "#c8a882",
    "editor.lineHighlightBackground": "#100e0b",
    "editor.selectionBackground": "#2a2112",
    "editorLineNumber.foreground": "#3a3228",
    "editorLineNumber.activeForeground": "#c47a3a",
    "editorCursor.foreground": "#d4894a",
    "editor.findMatchBackground": "#4a3010",
    "editorIndentGuide.background": "#1e1c18",
    "editorBracketMatch.background": "#3a2e1a",
    "editorBracketMatch.border": "#d4894a",
    "scrollbarSlider.background": "#2a2420",
    "scrollbarSlider.hoverBackground": "#3a3228",
  },
};

function handleEditorWillMount(monaco) {
  monaco.editor.defineTheme("caret", caretTheme);
}

let nextId = Date.now();

function newTab(name = "untitled") {
  return { id: nextId++, name, saved: false };
}

async function ensureDir() {
  const dirExists = await exists(TEMP_DIR, { baseDir: BaseDirectory.AppData });
  if (!dirExists) await mkdir(TEMP_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
}

async function saveTempContent(id, content) {
  await ensureDir();
  await writeTextFile(`${TEMP_DIR}/${id}.txt`, content, { baseDir: BaseDirectory.AppData });
}

async function loadTempContent(id) {
  try {
    return await readTextFile(`${TEMP_DIR}/${id}.txt`, { baseDir: BaseDirectory.AppData });
  } catch {
    return "";
  }
}

async function saveTabsMeta(tabs, activeId) {
  await ensureDir();
  await writeTextFile(TABS_META_FILE, JSON.stringify({ tabs, activeId }), { baseDir: BaseDirectory.AppData });
}

function App() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [contents, setContents] = useState({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef({});

  async function minmize() { await appWindow.minimize(); };
  async function maximize() { await appWindow.toggleMaximize(); };
  async function close() { await appWindow.close(); }

  // load tabs on startup
  useEffect(() => {
    async function loadTabs() {
      try {
        const raw = await readTextFile(TABS_META_FILE, { baseDir: BaseDirectory.AppData });
        const { tabs: savedTabs, activeId } = JSON.parse(raw);
        if (savedTabs.length === 0) {
          const t = newTab();
          setTabs([t]);
          setActiveTab(t.id);
          setLoaded(true);
          return;
        }
        const loadedContents = {};
        for (const tab of savedTabs) {
          loadedContents[tab.id] = await loadTempContent(tab.id);
        }
        setTabs(savedTabs);
        setActiveTab(activeId ?? savedTabs[0].id);
        setContents(loadedContents);
      } catch {
        const t = newTab();
        setTabs([t]);
        setActiveTab(t.id);
      }
      setLoaded(true);
    }
    loadTabs();
  }, []);

  // save tabs meta whenever tabs change
  useEffect(() => {
    if (!loaded) return;
    saveTabsMeta(tabs, activeTab);
  }, [tabs, activeTab, loaded]);

  function addTab() {
    const t = newTab();
    setTabs(prev => [...prev, t]);
    setActiveTab(t.id);
    setContents(prev => ({ ...prev, [t.id]: "" }));
  }

  function closeTab(e, id) {
    e.stopPropagation();
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeTab === id) {
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
    // clear temp file for unsaved tabs
    const tab = tabs.find(t => t.id === id);
    if (tab && !tab.saved) {
      writeTextFile(`${TEMP_DIR}/${id}.txt`, "", { baseDir: BaseDirectory.AppData }).catch(() => {});
    }
  }

  function handleChange(val, id) {
    setContents(prev => ({ ...prev, [id]: val ?? "" }));
    // debounced autosave to temp
    clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => {
      saveTempContent(id, val ?? "");
    }, 500);
  }

  const active = tabs.find(t => t.id === activeTab);

  if (!loaded) return null;

  return (
    <div className="shell">
      <div className="editor-shell">
        <div className="top-bar" data-tauri-drag-region>
          <div className="tab-bar">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${tab.id === activeTab ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {!tab.saved && <span className="tab-dot" />}
                <span className="tab-name">{tab.name}</span>
                <span className="tab-close" onClick={(e) => closeTab(e, tab.id)}>×</span>
              </div>
            ))}
            <div className="tab-add" onClick={addTab}>+</div>
          </div>

          <div className="window-control">
              <Minimize size={16} onClick={minmize} />
              <Expand size={16} onClick={maximize} />
              <X size={16} onClick={close} />
          </div>
        </div>
        {active ? (
          <Editor
            key={active.id}
            height="100%"
            width="100%"
            theme="caret"
            language="plaintext"
            value={contents[active.id] ?? ""}
            onChange={(val) => handleChange(val, active.id)}
            beforeMount={handleEditorWillMount}
            options={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              lineNumbersMinChars: 2,
              lineHeight: 1.8,
              padding: { top: 0, bottom: 0 },
              lineDecorationsWidth: 0,
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              minimap: {enabled: false},
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnEnter: "off",
              tabCompletion: "off",
              wordBasedSuggestions: "off",
              parameterHints: { enabled: false },
              cursorSmoothCaretAnimation: "on",
              cursorStyle: "line",
              cursorWidth: 2,
              smoothScrolling: true,
              mouseWheelScrollSensitivity: 0.8,
            }}
          />
        ) : (
          <div className="empty-state" onClick={addTab}>click to open a new tab</div>
        )}
      </div>
    </div>
  );
}

export default App;