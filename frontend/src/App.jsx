import { Route, Routes } from "react-router-dom";
import ElasticHowItWorksPage from "./pages/ElasticHowItWorksPage";
import QueryComparePage from "./pages/QueryComparePage";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/how-elastic-works" element={<ElasticHowItWorksPage />} />
      <Route path="/query-compare" element={<QueryComparePage />} />
    </Routes>
  );
}

export default App;
