import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Aftoris from './Pages/Aftoris/Aftoris';
import Registr from './Pages/Registr/Registr';
import Manager from './Pages/Manager/Manager';
import Home from './Pages/Home/Home';
import ProtectedRoute from './Componets/ProtectedRoute/ProtectedRoute';
import './App.css';

export default function App() {
  const [authState, setAuthState] = useState(() => ({
    isAuth: Boolean(localStorage.getItem('access_token') && localStorage.getItem('user_role')),
    userRole: localStorage.getItem('user_role'),
  }));

  const handleAuthChange = () => {
    setAuthState({
      isAuth: Boolean(localStorage.getItem('access_token') && localStorage.getItem('user_role')),
      userRole: localStorage.getItem('user_role'),
    });
  };

  const { isAuth, userRole } = authState;
  const isManager = isAuth && userRole === 'manager';

  return (
    <Routes>
      <Route
        path="/"
        element={
          isManager ? (
            <Navigate to="/manager/orders" />
          ) : (
            <Home isAuth={isAuth} userRole={userRole} onAuthChange={handleAuthChange} />
          )
        }
      />
      <Route
        path="/login"
        element={isAuth ? <Navigate to="/" /> : <Aftoris onAuthChange={handleAuthChange} />}
      />
      <Route
        path="/register"
        element={isAuth ? <Navigate to="/" /> : <Registr onAuthChange={handleAuthChange} />}
      />
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute isAuth={isAuth} role="manager" userRole={userRole}>
            <Manager onAuthChange={handleAuthChange} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
