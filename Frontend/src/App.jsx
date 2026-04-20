import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import InfoPage from "./pages/InfoPage.jsx";
import QuestionnairePage from "./pages/QuestionnairePage.jsx";
import AnalysisPage from "./pages/admin/AnalysisPage.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import CreateQuestionnairePage from "./pages/admin/CreateQuestionnairePage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/respondent-info/:id" element={<InfoPage />} />
        <Route path="/questionnaire/:id" element={<QuestionnairePage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
        <Route path="/admin/create-questionnaire" element={<ProtectedRoute><CreateQuestionnairePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
