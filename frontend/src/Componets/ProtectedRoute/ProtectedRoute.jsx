import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isAuth, role, userRole, children }) => {
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
