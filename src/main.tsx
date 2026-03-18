import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Disable right-click context menu and dev tools shortcuts
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
  // F12
  if (e.key === 'F12') e.preventDefault();
  // Ctrl+Shift+I / Cmd+Option+I (Inspect)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') e.preventDefault();
  // Ctrl+Shift+J / Cmd+Option+J (Console)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') e.preventDefault();
  // Ctrl+Shift+C / Cmd+Option+C (Element picker)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') e.preventDefault();
  // Ctrl+U / Cmd+U (View source)
  if ((e.ctrlKey || e.metaKey) && e.key === 'u') e.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
