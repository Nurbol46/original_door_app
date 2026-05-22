import { useEffect, useMemo, useState } from 'react';
import {
  createManagerService,
  deleteManagerService,
  getManagerServices,
  updateManagerService,
} from '../../../api';
import './ManagerServices.css';

const emptyServiceForm = { name: '', price: '' };

const formatPrice = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat('ru-RU').format(number);
};

const normalizePriceInput = (value) => String(value ?? '').replace(',', '.');

function ManagerServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyServiceForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyServiceForm);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getManagerServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Ошибка при загрузке прайса');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = useMemo(
    () => services.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [services],
  );

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!createForm.name.trim() || !createForm.price.trim()) {
      setError('Заполните название и цену услуги');
      return;
    }

    try {
      setCreating(true);
      setError('');
      await createManagerService({
        name: createForm.name.trim(),
        price: Number(normalizePriceInput(createForm.price)),
      });
      setCreateForm(emptyServiceForm);
      setShowForm(false);
      setFeedback('Услуга добавлена');
      await fetchServices();
    } catch (err) {
      setError('Ошибка при создании услуги');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setEditForm({
      name: service.name || '',
      price: String(service.price ?? ''),
    });
    setFeedback('');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyServiceForm);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editForm.name.trim() || !editForm.price.trim()) {
      setError('Заполните название и цену услуги');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await updateManagerService(editingId, {
        name: editForm.name.trim(),
        price: Number(normalizePriceInput(editForm.price)),
      });
      setFeedback('Прайс-лист обновлен');
      cancelEdit();
      await fetchServices();
    } catch (err) {
      setError('Ошибка при обновлении услуги');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить услугу из прайса?')) return;

    try {
      setDeletingId(id);
      setError('');
      await deleteManagerService(id);
      setFeedback('Услуга удалена');
      if (editingId === id) {
        cancelEdit();
      }
      await fetchServices();
    } catch (err) {
      setError('Ошибка при удалении услуги');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="manager-loading">Загрузка прайса...</div>;

  return (
    <div className="manager-services">
      <div className="services-hero">
        <div>
          <p className="services-eyebrow">Панель менеджера</p>
          <h2>Прайс-лист</h2>
          <p className="services-note">
            Добавляйте новые услуги, редактируйте стоимость и удаляйте устаревшие позиции.
          </p>
        </div>

        <div className="services-stats">
          <article>
            <span>Позиций</span>
            <strong>{services.length}</strong>
          </article>
          <article>
            <span>Сумма прайса</span>
            <strong>{formatPrice(totalPrice)} тг.</strong>
          </article>
        </div>
      </div>

      <div className="services-toolbar">
        <button className="toolbar-btn primary" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? 'Скрыть форму' : '+ Добавить услугу'}
        </button>
      </div>

      {feedback && <div className="success-message">{feedback}</div>}
      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="service-form" onSubmit={handleCreateSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Название услуги</span>
              <input
                type="text"
                name="name"
                value={createForm.name}
                onChange={handleCreateChange}
                placeholder="Например, установка дверей"
                required
              />
            </label>
            <label className="form-field">
              <span>Цена</span>
              <input
                type="number"
                name="price"
                value={createForm.price}
                onChange={handleCreateChange}
                step="0.01"
                placeholder="0.00"
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="toolbar-btn primary" disabled={creating}>
              {creating ? 'Создаем...' : 'Создать услугу'}
            </button>
          </div>
        </form>
      )}

      <div className="services-grid">
        {services.length === 0 ? (
          <div className="empty-state">
            <h3>Прайс пока пустой</h3>
            <p>Добавьте первую услугу, чтобы клиент видел список работ на главной странице.</p>
          </div>
        ) : (
          services.map((service) => {
            const isEditing = editingId === service.id;

            return (
              <article key={service.id} className={`service-card ${isEditing ? 'editing' : ''}`}>
                {!isEditing ? (
                  <>
                    <div className="service-header">
                      <div>
                        <p className="service-label">Услуга</p>
                        <h3>{service.name}</h3>
                      </div>
                      <span className="service-price">{formatPrice(service.price)} тг.</span>
                    </div>

                    <div className="card-actions">
                      <button
                        type="button"
                        className="toolbar-btn secondary"
                        onClick={() => startEdit(service)}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className="toolbar-btn danger"
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                      >
                        {deletingId === service.id ? 'Удаляем...' : 'Удалить'}
                      </button>
                    </div>
                  </>
                ) : (
                  <form className="edit-form" onSubmit={handleEditSubmit}>
                    <div className="form-grid">
                      <label className="form-field">
                        <span>Название услуги</span>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          required
                        />
                      </label>
                      <label className="form-field">
                        <span>Цена</span>
                        <input
                          type="number"
                          name="price"
                          value={editForm.price}
                          onChange={handleEditChange}
                          step="0.01"
                          required
                        />
                      </label>
                    </div>

                    <div className="card-actions">
                      <button type="submit" className="toolbar-btn primary" disabled={saving}>
                        {saving ? 'Сохраняем...' : 'Сохранить'}
                      </button>
                      <button type="button" className="toolbar-btn secondary" onClick={cancelEdit}>
                        Отмена
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ManagerServices;
