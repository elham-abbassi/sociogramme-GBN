import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import QuestionnairePage from "./pages/QuestionnairePage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/questionnaire/:id" element={<QuestionnairePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;