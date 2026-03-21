import { Route, Routes } from "react-router-dom";
import ElasticHowItWorksPage from "./pages/ElasticHowItWorksPage";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/how-elastic-works" element={<ElasticHowItWorksPage />} />
    </Routes>
  );
}

export default App;
