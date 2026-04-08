import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import QuestionnairePage from "./pages/QuestionnairePage.jsx";
import AnalysisPage from "./pages/admin/AnalysisPage.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import CreateQuestionnairePage from "./pages/admin/CreateQuestionnairePage.jsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/questionnaire/:id" element={<QuestionnairePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/analysis/:id" element={<AnalysisPage />} />
        <Route path="/admin/create-questionnaire" element={<CreateQuestionnairePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;