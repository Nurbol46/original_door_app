import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteManagerOrder, request } from '../../../api';
import './ManagerOrders.css';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateRange = (start, end) => {
  if (!start && !end) return '—';
  const startLabel = start ? formatDate(start) : '';
  const endLabel = end ? formatDate(end) : '';
  if (startLabel && endLabel) {
    return startLabel === endLabel ? startLabel : `${startLabel} — ${endLabel}`;
  }
  return startLabel || endLabel;
};

function ManagerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await request('/manager/orders/', { method: 'GET' });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Ошибка при загрузке заявок');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    awaiting_call: 'Ожидает звонка',
    awaiting_service: 'Ожидает услугу',
    paused: 'Приостановлен',
    completed: 'Завершен',
    cancelled: 'Отменен',
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = searchTerm
      ? String(order.order_number).toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Удалить заявку ${order.order_number}?`)) return;

    try {
      setDeletingId(order.id);
      setError('');
      await deleteManagerOrder(order.id);
      await fetchOrders();
    } catch (err) {
      setError('Ошибка при удалении заявки');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="manager-orders">
      <h2>Все заявки</h2>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Поиск по номеру заявки..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">Все статусы</option>
          <option value="awaiting_call">Ожидает звонок</option>
          <option value="awaiting_service">Ожидает услугу</option>
          <option value="paused">Приостановлен</option>
          <option value="completed">Завершен</option>
          <option value="cancelled">Отменен</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="no-orders">Нет заявок</p>
      ) : (
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>№ Заявки</th>
                <th>Клиент</th>
                <th>Статус</th>
                <th>Дата создания</th>
                <th>Желаемый срок</th>
                <th>Дата работы</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.user_full_name}</td>
                  <td>
                    <span className={`status ${order.status}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{formatDateRange(order.work_date_start, order.work_date_end)}</td>
                  <td>{order.work_date ? new Date(order.work_date).toLocaleDateString('ru-RU') : '-'}</td>
                  <td>
                    <button
                      className="detail-btn"
                      onClick={() => navigate(`/manager/orders/${order.id}`)}
                    >
                      Подробнее
                    </button>
                    <button
                      className="order-delete-btn"
                      onClick={() => handleDeleteOrder(order)}
                      disabled={deletingId === order.id}
                    >
                      {deletingId === order.id ? 'Удаляем...' : 'Удалить'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManagerOrders;
