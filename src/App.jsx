import "./App.css";
import Editor from "@monaco-editor/react";
import "@fontsource/jetbrains-mono"

const aetherTheme = {
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
}

function handleEditorWillMount(monaco) {
  monaco.editor.defineTheme("aether", aetherTheme)
}

function App() {
  return (
  <div className="shell">
    <div className="editor-shell">n
      <Editor
        height="100%"
        width="100%"
        theme="aether"
        beforeMount={handleEditorWillMount}
        options={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 13,
          lineHeight: 1.8,
          padding: { top: 14 },
          minimap: { enabled: true },
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
    </div>
  </div>
  );
}

export default App;