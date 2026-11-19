import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Goals from "./pages/Goals";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/history" element={<History />} />

        <Route path="/goals" element={<Goals />} />

        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
