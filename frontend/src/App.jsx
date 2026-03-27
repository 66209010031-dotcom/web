// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage          from './pages/LoginPage';
import AdminDashboard     from './pages/admin/Dashboard';
import AdminPeriods       from './pages/admin/Periods';
import AdminIndicators    from './pages/admin/Indicators';
import AdminEvaluatees    from './pages/admin/Evaluatees';
import StaffDashboard     from './pages/staff/Dashboard';
import SelfEvaluation     from './pages/staff/SelfEvaluation';
import StaffResult        from './pages/staff/Result';
import EvaluatorDashboard from './pages/evaluator/Dashboard';
import EvaluationForm     from './pages/evaluator/EvaluationForm';
import EvaluatorSummary   from './pages/evaluator/Summary';

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const home = { admin: '/admin', staff: '/staff', evaluator: '/evaluator' }[user.role] || '/login';
    return <Navigate to={home} replace />;
  }
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map = { admin: '/admin', staff: '/staff', evaluator: '/evaluator' };
  return <Navigate to={map[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ 
  v7_startTransition: true,      // ← แก้ warning แรก
  v7_relativeSplatPath: true     // ← แก้ warning ที่สอง
}}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin */}
          <Route path="/admin"                                  element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
          <Route path="/admin/periods"                          element={<Protected roles={['admin']}><AdminPeriods /></Protected>} />
          <Route path="/admin/periods/:id/indicators"           element={<Protected roles={['admin']}><AdminIndicators /></Protected>} />
          <Route path="/admin/periods/:id/evaluatees"           element={<Protected roles={['admin']}><AdminEvaluatees /></Protected>} />

          {/* Staff */}
          <Route path="/staff"                                  element={<Protected roles={['staff']}><StaffDashboard /></Protected>} />
          <Route path="/staff/evaluate/:evaluateeId"            element={<Protected roles={['staff']}><SelfEvaluation /></Protected>} />
          <Route path="/staff/result/:evaluateeId"              element={<Protected roles={['staff']}><StaffResult /></Protected>} />

          {/* Evaluator */}
          <Route path="/evaluator"                              element={<Protected roles={['evaluator']}><EvaluatorDashboard /></Protected>} />
          <Route path="/evaluator/form/:assignmentId"           element={<Protected roles={['evaluator']}><EvaluationForm /></Protected>} />
          <Route path="/evaluator/summary/:evaluateeId"         element={<Protected roles={['evaluator']}><EvaluatorSummary /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
