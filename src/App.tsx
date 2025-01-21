import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Picking from "./pages/Picking";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/picking/:orderId" element={<Picking />} />
      </Routes>
    </Router>
  );
}

export default App;