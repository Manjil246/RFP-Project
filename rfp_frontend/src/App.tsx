import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import RFPs from "./pages/rfps";
import RFPDetail from "./pages/rfp-detail";
import Vendors from "./pages/vendors";
import Proposals from "./pages/proposals";
import ProposalDetail from "./pages/proposal-detail";
import Compare from "./pages/compare";
import CompareDetail from "./pages/compare-detail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="rfps" element={<RFPs />} />
          <Route path="rfps/:id" element={<RFPDetail />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="proposals/:id" element={<ProposalDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="compare/:id" element={<CompareDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
