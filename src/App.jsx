import "./App.css";
import Editor from "@monaco-editor/react";

function App() {
  return (
  <div className="shell">
    <Editor
      height="100%"
      width="100%"
    />
  </div>
  );
}

export default App;