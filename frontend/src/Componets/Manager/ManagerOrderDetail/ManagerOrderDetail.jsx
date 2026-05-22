import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteManagerOrder, request } from '../../../api';
import './ManagerOrderDetail.css';

const toInputDateValue = (value) => (value ? String(value).slice(0, 10) : '');

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

function ManagerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusLabels = {
    awaiting_call: 'Ожидает звонка',
    awaiting_service: 'Ожидает услугу',
    paused: 'Приостановлен',
    completed: 'Завершен',
    cancelled: 'Отменен',
  };

  // FIX: useCallback объявлен ДО useEffect — раньше было наоборот,
  // что вызывало ReferenceError (temporal dead zone с const)
  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/manager/orders/${id}/`, { method: 'GET' });
      setOrder(data);
      setFormData({
        status: data.status,
        work_date: toInputDateValue(data.work_date),
        work_date_start: toInputDateValue(data.work_date_start),
        work_date_end: toInputDateValue(data.work_date_end),
        comment: data.comment || '',
        specialist: data.specialist?.full_name || '',
      });
    } catch (err) {
      setError('Ошибка при загрузке заявки');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      // Отправляем только нужные поля (без specialist как строки)
      const payload = {
        status: formData.status,
        work_date: formData.work_date || null,
        work_date_start: formData.work_date_start || null,
        work_date_end: formData.work_date_end || null,
        comment: formData.comment,
      };
      await request(`/manager/orders/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditing(false);
      await fetchOrderDetail();
    } catch (err) {
      setError('Ошибка при обновлении заявки');
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const formDataFile = new FormData();
      formDataFile.append('file', file);
      await request(`/manager/orders/${id}/files/`, {
        method: 'POST',
        body: formDataFile,
      });
      await fetchOrderDetail();
      e.target.value = '';
    } catch (err) {
      setError('Ошибка при загрузке файла');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить заявку #${order.order_number}?`)) return;
    try {
      setDeleting(true);
      await deleteManagerOrder(order.id);
      navigate('/manager/orders');
    } catch (err) {
      setError('Ошибка при удалении заявки');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">Заявка не найдена</div>;

  return (
    <div className="order-detail">
      <button className="back-btn" onClick={() => navigate('/manager/orders')}>
        ← Назад к заявкам
      </button>

      <div className="detail-card">
        <h2>Заявка #{order.order_number}</h2>

        <div className="detail-section">
          <h3>Информация о клиенте</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Клиент:</label>
              <span>{order.user?.full_name || '-'}</span>
            </div>
            <div className="info-item">
              <label>Телефон:</label>
              <span>{order.user?.number || '-'}</span>
            </div>
            <div className="info-item">
              <label>Дата создания:</label>
              <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Информация о заявке</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Тип работы:</label>
              <span>{order.order_type || '-'}</span>
            </div>
            <div className="info-item">
              <label>Адрес:</label>
              <span>{order.address || '-'}</span>
            </div>
            <div className="info-item">
              <label>Желаемый срок:</label>
              <span>{formatDateRange(order.work_date_start, order.work_date_end)}</span>
            </div>
            {order.comment && (
              <div className="info-item">
                <label>Комментарий клиента:</label>
                <span>{order.comment}</span>
              </div>
            )}
          </div>
        </div>

        {!editing ? (
          <div className="detail-section">
            <h3>Статус и дата работы</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Статус:</label>
                <span className={`status ${order.status}`}>{statusLabels[order.status] || order.status}</span>
              </div>
              <div className="info-item">
                <label>Дата работы:</label>
                <span>{order.work_date ? new Date(order.work_date).toLocaleDateString('ru-RU') : '-'}</span>
              </div>
              {order.specialist && (
                <div className="info-item">
                  <label>Специалист:</label>
                  <span>{order.specialist.full_name}</span>
                </div>
              )}
            </div>
            <div className="action-row">
              <button className="edit-btn" onClick={() => setEditing(true)}>
                Редактировать
              </button>
              <button className="detail-delete-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Удаляем...' : 'Удалить заявку'}
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-section editing">
            <h3>Редактирование</h3>
            <div className="form-group">
              <label>Статус:</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="awaiting_call">Ожидает звонок</option>
                <option value="awaiting_service">Ожидает услугу</option>
                <option value="paused">Приостановлен</option>
                <option value="completed">Завершен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
            <div className="form-group">
              <label>Желаемая дата начала (от клиента):</label>
              <input type="date" name="work_date_start" value={formData.work_date_start} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Желаемая дата конца (от клиента):</label>
              <input type="date" name="work_date_end" value={formData.work_date_end} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Дата работы (назначает менеджер):</label>
              <input type="date" name="work_date" value={formData.work_date} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Примечания:</label>
              <textarea name="comment" value={formData.comment} onChange={handleInputChange} rows="4" />
            </div>
            <div className="button-group">
              <button className="save-btn" onClick={handleUpdate}>Сохранить</button>
              <button className="cancel-btn" onClick={() => setEditing(false)}>Отмена</button>
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3>Файлы</h3>
          <div className="files-section">
            <label className="file-upload-label">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {uploading ? 'Загрузка...' : '+ Загрузить файл'}
            </label>
            {order.files && order.files.length > 0 ? (
              <ul className="files-list">
                {order.files.map((file) => (
                  <li key={file.id}>
                    <a href={file.file} target="_blank" rel="noreferrer">
                      {decodeURIComponent(file.file.split('/').pop())}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Нет файлов</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerOrderDetail;
