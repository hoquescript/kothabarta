import { Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Meeting from "./pages/Meeting";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/meet/:meetId" element={<Meeting />} />
    </Routes>
  );
}

export default App;
