import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import SelectBase from "./pages/SelectBase"
import DashboardLayout from "./layouts/DashboardLayout"
import Dashboard from "./pages/Dashboard"
import Approvals from "./pages/Approvals"
import Producao from "./pages/Producao"
import ControleEstoque from "./pages/ControleEstoque"
import FinanceiroLayout from "./pages/financeiro/FinanceiroLayout"
import VendasLayout from "./pages/vendas/VendasLayout"
import Gestao from "./pages/Gestao"
import CentralAjuda from "./pages/CentralAjuda"

function PrivateRoute({ children }) {
  const token = localStorage.getItem("jwt_token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/select-base" element={<SelectBase />} />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="producao" element={<Producao />} />
          <Route path="estoque/*" element={<ControleEstoque />} />
          <Route path="financeiro/*" element={<FinanceiroLayout />} />
          <Route path="vendas/*" element={<VendasLayout />} />
          <Route path="gestao" element={<Gestao />} />
          <Route path="ajuda" element={<CentralAjuda />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
