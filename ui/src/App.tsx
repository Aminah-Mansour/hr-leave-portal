import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AgentChatPage from './pages/AgentChatPage'
import EmployeesPage from './pages/EmployeesPage'
import HrRequestsPage from './pages/HrRequestsPage'
import LeavePage from './pages/LeavePage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/employees" replace />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/hr-requests" element={<HrRequestsPage />} />
        <Route path="/assistant" element={<AgentChatPage />} />
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Routes>
    </Layout>
  )
}

export default function RoutedApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
