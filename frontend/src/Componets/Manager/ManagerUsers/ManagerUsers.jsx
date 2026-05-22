import { useEffect, useMemo, useState } from 'react';
import { deleteManagerUser, getManagerUsers } from '../../../api';
import './ManagerUsers.css';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

function ManagerUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getManagerUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Ошибка при загрузке пользователей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(
    () => users.filter((user) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch = search
        ? [user.full_name, user.email, user.number, user.shop?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
        : true;
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      return matchesSearch && matchesRole;
    }),
    [users, searchTerm, roleFilter],
  );

  const handleDelete = async (user) => {
    if (!window.confirm(`Удалить пользователя ${user.full_name || user.email}?`)) return;

    try {
      setDeletingId(user.id);
      setError('');
      await deleteManagerUser(user.id);
      setFeedback('Пользователь удален');
      if (String(user.id) === localStorage.getItem('user_id')) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      await fetchUsers();
    } catch (err) {
      setError('Ошибка при удалении пользователя');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="manager-loading">Загрузка пользователей...</div>;

  return (
    <div className="manager-users">
      <div className="users-hero">
        <div>
          <p className="users-eyebrow">Панель менеджера</p>
          <h2>Пользователи</h2>
          <p className="users-note">
            Здесь видны клиенты, их аватары, магазины и даты рождения. Удаление пользователя также удаляет его заявки.
          </p>
        </div>

        <div className="users-stats">
          <article>
            <span>Всего</span>
            <strong>{users.length}</strong>
          </article>
          <article>
            <span>Клиенты</span>
            <strong>{users.filter((user) => user.role === 'user').length}</strong>
          </article>
        </div>
      </div>

      <div className="users-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск по имени, email, телефону или магазину..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select
          className="status-filter"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="">Все роли</option>
          <option value="user">Клиенты</option>
          <option value="manager">Менеджеры</option>
        </select>
      </div>

      {feedback && <div className="success-message">{feedback}</div>}
      {error && <div className="error-message">{error}</div>}

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <h3>Пользователи не найдены</h3>
          <p>Попробуйте изменить поиск или фильтр по роли.</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <article key={user.id} className="user-card">
              <div className="user-card__top">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.full_name || user.email} />
                  ) : (
                    <span>{(user.full_name || user.email || '?')[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="user-role">{user.role === 'manager' ? 'Менеджер' : 'Клиент'}</p>
                  <h3>{user.full_name || 'Без имени'}</h3>
                  <p className="user-meta">{user.email}</p>
                </div>
              </div>

              <div className="user-info">
                <div>
                  <span>Телефон</span>
                  <strong>{user.number || '—'}</strong>
                </div>
                <div>
                  <span>Дата рождения</span>
                  <strong>{formatDate(user.date_of_birth)}</strong>
                </div>
                <div>
                  <span>Магазин</span>
                  <strong>{user.shop?.name || '—'}</strong>
                </div>
                <div>
                  <span>Адрес</span>
                  <strong>
                    {[user.shop?.city, user.shop?.street, user.shop?.house_number].filter(Boolean).join(', ') || '—'}
                  </strong>
                </div>
                <div>
                  <span>Дата регистрации</span>
                  <strong>{formatDate(user.date_joined)}</strong>
                </div>
              </div>

              <div className="user-actions">
                <button
                  type="button"
                  className="toolbar-btn danger"
                  onClick={() => handleDelete(user)}
                  disabled={deletingId === user.id}
                >
                  {deletingId === user.id ? 'Удаляем...' : 'Удалить пользователя'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManagerUsers;
