import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { SessionPage } from "./pages/SessionPage";
import { WorkingChangesPage } from "./pages/WorkingChangesPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="min-h-screen bg-background dark">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:id" element={<SessionPage />} />
        <Route path="/working" element={<WorkingChangesPage />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
