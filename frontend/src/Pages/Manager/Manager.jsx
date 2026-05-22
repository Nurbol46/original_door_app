import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import ManagerOrders from '../../Componets/Manager/ManagerOrders/ManagerOrders';
import ManagerOrderDetail from '../../Componets/Manager/ManagerOrderDetail/ManagerOrderDetail';
import ManagerServices from '../../Componets/Manager/ManagerServices/ManagerServices';
import ManagerUsers from '../../Componets/Manager/ManagerUsers/ManagerUsers';
import { getFullName } from '../../api';
import './Manager.css';

export default function Manager({ onAuthChange }) {
  const navigate = useNavigate();
  const fullName = getFullName();

  const handleLogout = () => {
    localStorage.clear();
    if (onAuthChange) onAuthChange();
    navigate('/');
  };

  return (
    <div className="manager-container">
      <header className="manager-header">
        <div>
          <p className="manager-subtitle">Панель управления</p>
          <h1>PRO Монтаж</h1>
          {fullName && <p className="manager-name">{fullName}</p>}
        </div>
        <nav className="manager-nav">
          <NavLink
            to="/manager/orders"
            className={({ isActive }) => `manager-link ${isActive ? 'active' : ''}`}
          >
            Заявки
          </NavLink>
          <NavLink
            to="/manager/services"
            className={({ isActive }) => `manager-link ${isActive ? 'active' : ''}`}
          >
            Услуги
          </NavLink>
          <NavLink
            to="/manager/users"
            className={({ isActive }) => `manager-link ${isActive ? 'active' : ''}`}
          >
            Пользователи
          </NavLink>
          <button className="manager-logout" onClick={handleLogout}>
            Выход
          </button>
        </nav>
      </header>

      <main className="manager-main">
        <Routes>
          <Route path="orders" element={<ManagerOrders />} />
          <Route path="orders/:id" element={<ManagerOrderDetail />} />
          <Route path="services" element={<ManagerServices />} />
          <Route path="users" element={<ManagerUsers />} />
          <Route index element={<ManagerOrders />} />
        </Routes>
      </main>
    </div>
  );
}
