import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cor from '../../assets/corridor.svg';
import {
  createOrder,
  downloadServicesPdf,
  getFullName,
  getMyOrders,
  getNotifications,
  getProfile,
  getServices,
  markNotificationRead,
  updateProfile,
} from '../../api';
import './Home.css';

const STATUS_LABELS = {
  awaiting_call: 'Ожидает звонка',
  awaiting_service: 'Ожидает услугу',
  paused: 'Приостановлен',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const CUSTOM_SERVICE = '__custom__';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
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

const toInputDateValue = (value) => (value ? String(value).slice(0, 10) : '');

const formatPrice = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat('ru-RU').format(number);
};

const buildProfileForm = (profileData) => ({
  full_name: profileData?.full_name || '',
  number: profileData?.number || '',
  date_of_birth: toInputDateValue(profileData?.date_of_birth),
  avatar: profileData?.avatar || '',
  shop: {
    name: profileData?.shop?.name || '',
    city: profileData?.shop?.city || '',
    street: profileData?.shop?.street || '',
    house_number: profileData?.shop?.house_number || '',
  },
});

const countByStatus = (orders, statuses) => orders.filter((order) => statuses.includes(order.status)).length;

export default function Home({ isAuth, userRole, onAuthChange }) {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');

  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('');

  const [orderForm, setOrderForm] = useState({
    selectedType: '',
    customType: '',
    comment: '',
    work_date_start: '',
    work_date_end: '',
  });

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardNotice, setDashboardNotice] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [notificationBusyId, setNotificationBusyId] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        const data = await getServices();
        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setServicesError('Не удалось загрузить список услуг');
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (!isAuth || userRole === 'manager') return;

    const loadCabinet = async () => {
      try {
        setDashboardLoading(true);
        setDashboardError('');

        const [ordersData, notificationsData, profileData] = await Promise.all([
          getMyOrders(),
          getNotifications(),
          getProfile(),
        ]);

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        setProfile(profileData);
        setProfileForm(buildProfileForm(profileData));
        setProfileAvatarFile(null);
        setProfileAvatarPreview('');
        setDashboardNotice('');
      } catch (error) {
        console.error(error);
        setDashboardError('Не удалось загрузить данные кабинета');
      } finally {
        setDashboardLoading(false);
      }
    };

    loadCabinet();
  }, [isAuth, userRole]);

  useEffect(() => {
    if (isAuth && userRole === 'manager') {
      navigate('/manager/orders', { replace: true });
    }
  }, [isAuth, userRole, navigate]);

  useEffect(() => {
    if (!isAuth || userRole === 'manager') return;
    if (orderForm.selectedType) return;

    setOrderForm((prev) => ({
      ...prev,
      selectedType: services[0]?.name || CUSTOM_SERVICE,
    }));
  }, [isAuth, userRole, services, orderForm.selectedType]);

  const refreshCabinet = async () => {
    const [ordersData, notificationsData, profileData] = await Promise.all([
      getMyOrders(),
      getNotifications(),
      getProfile(),
    ]);

    setOrders(Array.isArray(ordersData) ? ordersData : []);
    setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    setProfile(profileData);
    setProfileForm(buildProfileForm(profileData));
    setProfileAvatarFile(null);
    setProfileAvatarPreview('');
  };

  const handleLogout = () => {
    localStorage.clear();
    if (onAuthChange) onAuthChange();
    setOrders([]);
    setNotifications([]);
    setProfile(null);
    setProfileForm(null);
    setProfileAvatarFile(null);
    setProfileAvatarPreview('');
    setDashboardNotice('');
    setDashboardError('');
    navigate('/');
  };

  useEffect(() => {
    return () => {
      if (profileAvatarPreview?.startsWith('blob:')) {
        window.URL.revokeObjectURL(profileAvatarPreview);
      }
    };
  }, [profileAvatarPreview]);

  const handleDownloadPrice = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await downloadServicesPdf();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'price_list.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setDashboardError('Не удалось скачать прайс-лист');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOrderTypeChange = (event) => {
    setOrderForm((prev) => ({
      ...prev,
      selectedType: event.target.value,
    }));
  };

  const handleCustomTypeChange = (event) => {
    setOrderForm((prev) => ({
      ...prev,
      customType: event.target.value,
    }));
  };

  const handleCommentChange = (event) => {
    setOrderForm((prev) => ({
      ...prev,
      comment: event.target.value,
    }));
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    const resolvedType = orderForm.selectedType === CUSTOM_SERVICE
      ? orderForm.customType.trim()
      : orderForm.selectedType.trim();

    if (!resolvedType) {
      setDashboardError('Выберите услугу или опишите свою');
      return;
    }

    try {
      setSubmittingOrder(true);
      setDashboardError('');
      await createOrder({
        order_type: resolvedType,
        comment: orderForm.comment.trim(),
        work_date_start: orderForm.work_date_start || null,
        work_date_end: orderForm.work_date_end || null,
      });
      setDashboardNotice('Заявка создана и отправлена менеджеру');
      setOrderForm((prev) => ({
        ...prev,
        comment: '',
        work_date_start: '',
        work_date_end: '',
        customType: prev.selectedType === CUSTOM_SERVICE ? '' : prev.customType,
      }));
      try {
        await refreshCabinet();
      } catch (refreshError) {
        console.error(refreshError);
      }
    } catch (error) {
      console.error(error);
      setDashboardError('Не удалось создать заявку');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleShopFieldChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      shop: {
        ...prev.shop,
        [field]: value,
      },
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfileAvatarFile(null);
      setProfileAvatarPreview('');
      return;
    }

    setProfileAvatarFile(file);
    setProfileAvatarPreview(window.URL.createObjectURL(file));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!profileForm) return;

    try {
      setSavingProfile(true);
      setDashboardError('');
      const payload = new FormData();
      payload.append('full_name', profileForm.full_name.trim());
      payload.append('number', profileForm.number.trim());
      if (profileForm.date_of_birth) {
        payload.append('date_of_birth', profileForm.date_of_birth);
      }
      payload.append('shop_name', profileForm.shop.name.trim());
      payload.append('shop_city', profileForm.shop.city.trim());
      payload.append('shop_street', profileForm.shop.street.trim());
      payload.append('shop_house_number', profileForm.shop.house_number.trim());
      if (profileAvatarFile) {
        payload.append('avatar', profileAvatarFile);
      }

      await updateProfile(payload);
      localStorage.setItem('full_name', profileForm.full_name.trim());
      setDashboardNotice('Профиль обновлен');
      try {
        await refreshCabinet();
      } catch (refreshError) {
        console.error(refreshError);
      }
    } catch (error) {
      console.error(error);
      setDashboardError('Не удалось сохранить профиль');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNotificationRead = async (id) => {
    try {
      setNotificationBusyId(id);
      await markNotificationRead(id);
      try {
        await refreshCabinet();
      } catch (refreshError) {
        console.error(refreshError);
      }
    } catch (error) {
      console.error(error);
      setDashboardError('Не удалось отметить уведомление');
    } finally {
      setNotificationBusyId(null);
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const activeOrdersCount = countByStatus(orders, ['awaiting_call', 'awaiting_service', 'paused']);
  const finishedOrdersCount = countByStatus(orders, ['completed']);
  const totalOrdersCount = orders.length;
  const profileName = profile?.full_name || getFullName() || 'клиент';
  const profileAvatarSrc = profileAvatarPreview || profileForm?.avatar || '';

  if (isAuth && userRole !== 'manager') {
    return (
      <div className="home-shell">
        <header className="cabinet-hero">
          <div className="cabinet-hero__content">
            <p className="eyebrow">Личный кабинет</p>
            <h1>Здравствуйте, {profileName.split(' ')[0] || profileName}</h1>
            <p className="lede">
              Здесь можно создать заявку, отследить статусы работ, обновить профиль и скачать прайс-лист.
            </p>

            <div className="hero-actions">
              <button className="primary-btn" onClick={handleDownloadPrice} disabled={downloadingPdf}>
                {downloadingPdf ? 'Скачиваем...' : 'Скачать прайс PDF'}
              </button>
              <a className="primary-btn" href="#new-order">
                Создать заявку
              </a>
              <button className="secondary-btn" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </div>

          <div className="cabinet-hero__stats">
            <article className="mini-card">
              <span>Всего заявок</span>
              <strong>{totalOrdersCount}</strong>
            </article>
            <article className="mini-card">
              <span>В работе</span>
              <strong>{activeOrdersCount}</strong>
            </article>
            <article className="mini-card">
              <span>Завершено</span>
              <strong>{finishedOrdersCount}</strong>
            </article>
            <article className="mini-card accent">
              <span>Новых уведомлений</span>
              <strong>{unreadCount}</strong>
            </article>
          </div>
        </header>

        <main className="cabinet-grid">
          <section className="panel" id="new-order">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Быстрый старт</p>
                <h2>Создать новую заявку</h2>
              </div>
              <p className="panel-note">Выберите услугу из списка или опишите задачу своими словами.</p>
            </div>

            <div className="service-chips">
              {services.slice(0, 6).map((service) => (
                <button
                  key={service.id}
                  className={`chip ${orderForm.selectedType === service.name ? 'chip--active' : ''}`}
                  onClick={() => setOrderForm((prev) => ({ ...prev, selectedType: service.name }))}
                  type="button"
                >
                  {service.name}
                </button>
              ))}
              <button
                className={`chip ${orderForm.selectedType === CUSTOM_SERVICE ? 'chip--active' : ''}`}
                onClick={() => setOrderForm((prev) => ({ ...prev, selectedType: CUSTOM_SERVICE }))}
                type="button"
              >
                Своя услуга
              </button>
            </div>

            <form className="order-form" onSubmit={handleCreateOrder}>
              <label className="field">
                <span>Тип работ</span>
                <select value={orderForm.selectedType} onChange={handleOrderTypeChange}>
                  <option value="" disabled>
                    Выберите услугу
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                  <option value={CUSTOM_SERVICE}>Своя услуга</option>
                </select>
              </label>

              {orderForm.selectedType === CUSTOM_SERVICE && (
                <label className="field">
                  <span>Опишите услугу</span>
                  <input
                    type="text"
                    value={orderForm.customType}
                    onChange={handleCustomTypeChange}
                    placeholder="Например, монтаж витрины или замена оборудования"
                  />
                </label>
              )}

              <label className="field">
                <span>Комментарий</span>
                <textarea
                  value={orderForm.comment}
                  onChange={handleCommentChange}
                  rows="4"
                  placeholder="Укажите детали заявки, удобное время и любые пожелания"
                />
              </label>

              <div className="date-range">
                <span>Желаемый срок выполнения</span>
                <div className="date-range__grid">
                  <label className="field">
                    <span>От</span>
                    <input
                      type="date"
                      value={orderForm.work_date_start}
                      onChange={(event) => setOrderForm((prev) => ({
                        ...prev,
                        work_date_start: event.target.value,
                      }))}
                    />
                  </label>
                  <label className="field">
                    <span>До</span>
                    <input
                      type="date"
                      value={orderForm.work_date_end}
                      onChange={(event) => setOrderForm((prev) => ({
                        ...prev,
                        work_date_end: event.target.value,
                      }))}
                    />
                  </label>
                </div>
              </div>

              <button className="primary-btn" type="submit" disabled={submittingOrder}>
                {submittingOrder ? 'Создаем заявку...' : 'Создать заявку'}
              </button>
            </form>
          </section>

          <aside className="sidebar-stack">
            <section className="panel">
              <div className="panel-head compact">
                <div>
                  <p className="eyebrow">Профиль</p>
                  <h2>Данные магазина</h2>
                </div>
              </div>

              {profileForm ? (
                <form className="profile-form" onSubmit={handleSaveProfile}>
                  <label className="field">
                    <span>ФИО</span>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(event) => handleProfileFieldChange('full_name', event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Телефон</span>
                    <input
                      type="tel"
                      value={profileForm.number}
                      onChange={(event) => handleProfileFieldChange('number', event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Дата рождения</span>
                    <input
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(event) => handleProfileFieldChange('date_of_birth', event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Название магазина</span>
                    <input
                      type="text"
                      value={profileForm.shop.name}
                      onChange={(event) => handleShopFieldChange('name', event.target.value)}
                    />
                  </label>

                  <div className="field-grid">
                    <label className="field">
                      <span>Город</span>
                      <input
                        type="text"
                        value={profileForm.shop.city}
                        onChange={(event) => handleShopFieldChange('city', event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Улица</span>
                      <input
                        type="text"
                        value={profileForm.shop.street}
                        onChange={(event) => handleShopFieldChange('street', event.target.value)}
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Дом / офис</span>
                    <input
                      type="text"
                      value={profileForm.shop.house_number}
                      onChange={(event) => handleShopFieldChange('house_number', event.target.value)}
                    />
                  </label>

                  <div className="profile-media">
                    <div className="profile-avatar">
                      {profileAvatarSrc ? (
                        <img src={profileAvatarSrc} alt="Аватар пользователя" />
                      ) : (
                        <div className="profile-avatar__placeholder">
                          {(profileName?.[0] || 'П').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="profile-media__content">
                      <strong>{profile?.email || 'Профиль магазина'}</strong>
                      <p>
                        {profileForm.date_of_birth
                          ? `Дата рождения: ${formatDate(profileForm.date_of_birth)}`
                          : 'Дата рождения не указана'}
                      </p>
                    </div>
                  </div>

                  <label className="field">
                    <span>Аватар профиля</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <small className="field-hint">
                      PNG, JPG или WebP. Можно обновить фото профиля в любой момент.
                    </small>
                  </label>

                  <button className="secondary-btn" type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Сохраняем...' : 'Сохранить профиль'}
                  </button>
                </form>
              ) : (
                <p className="empty-state">Профиль загружается...</p>
              )}
            </section>

            <section className="panel">
              <div className="panel-head compact">
                <div>
                  <p className="eyebrow">Уведомления</p>
                  <h2>{unreadCount ? `Новых: ${unreadCount}` : 'Все прочитано'}</h2>
                </div>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <p className="empty-state">Пока уведомлений нет</p>
                ) : (
                  notifications.slice(0, 4).map((item) => (
                    <article key={item.id} className={`notification-card ${item.is_read ? 'read' : 'unread'}`}>
                      <div>
                        <p className="notification-title">
                          Заявка #{item.order?.order_number || '—'}
                        </p>
                        <p className="notification-meta">
                          {STATUS_LABELS[item.order?.status] || item.order?.status || 'Обновление'}
                        </p>
                        <p className="notification-date">{formatDate(item.created_at)}</p>
                      </div>
                      {!item.is_read && (
                        <button
                          type="button"
                          className="tiny-btn"
                          onClick={() => handleNotificationRead(item.id)}
                          disabled={notificationBusyId === item.id}
                        >
                          {notificationBusyId === item.id ? '...' : 'Прочитано'}
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>

          <section className="panel panel--wide">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Заявки</p>
                <h2>Мои обращения</h2>
              </div>
            </div>

            {dashboardLoading ? (
              <p className="empty-state">Загружаем кабинет...</p>
            ) : orders.length === 0 ? (
              <div className="empty-state empty-state--panel">
                <h3>Пока нет заявок</h3>
                <p>Создайте первую заявку в форме выше, и она сразу появится здесь.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.slice(0, 8).map((order) => (
                  <article key={order.id} className="order-row">
                    <div>
                      <p className="order-number">#{order.order_number}</p>
                      <h3>{order.order_type}</h3>
                      <p className="order-date">Создана: {formatDate(order.created_at)}</p>
                      <p className="order-range">
                        Желаемый срок: {formatDateRange(order.work_date_start, order.work_date_end)}
                      </p>
                    </div>
                    <div className="order-meta">
                      <span className={`status-pill ${order.status}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <span className="order-date">
                        Дата работ: {order.work_date ? formatDate(order.work_date) : 'не назначена'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        {(dashboardError || servicesError) && (
          <div className="toast toast--error">
            {dashboardError || servicesError}
          </div>
        )}

        {dashboardNotice && (
          <div className="toast toast--success">
            {dashboardNotice}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="home-shell">
      <header className="landing-nav">
        <div className="brand-lockup">
          <span className="brand-mark">PM</span>
          <div>
            <p className="eyebrow">PRO Монтаж</p>
            <strong>Сервис для магазинов и торговых точек</strong>
          </div>
        </div>

        <nav className="landing-links">
          <a href="#services">Услуги</a>
          <a href="#process">Как это работает</a>
          <a href="#contacts">Контакты</a>
        </nav>

        <div className="landing-actions">
          <Link className="ghost-btn" to="/login">
            Войти
          </Link>
          <Link className="primary-btn" to="/register">
            Регистрация
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Быстрый монтаж, понятные заявки, прозрачный сервис</p>
            <h1>Сайт, через который магазин получает сервис без лишней суеты.</h1>
            <p className="lede">
              Оставляйте заявки на монтаж и обслуживание, смотрите актуальные цены,
              получайте уведомления и ведите работу в одном аккуратном личном кабинете.
            </p>

            <div className="hero-actions">
              <Link className="primary-btn" to="/register">
                Создать аккаунт
              </Link>
              <Link className="secondary-btn" to="/login">
                Войти в кабинет
              </Link>
            </div>

            <div className="hero-badges">
              <div className="badge">
                <strong>24/7</strong>
                <span>прием заявок</span>
              </div>
              <div className="badge">
                <strong>1 день</strong>
                <span>на старт работ</span>
              </div>
              <div className="badge">
                <strong>PDF</strong>
                <span>прайс-лист на скачивание</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card visual-card--image">
              <img src={Cor} alt="Интерьер торгового коридора" />
            </div>
            <div className="visual-card visual-card--stack">
              <div>
                <span className="card-label">Набор услуг</span>
                <strong>{servicesLoading ? 'Загрузка...' : `${services.length} позиций`}</strong>
              </div>
              <div>
                <span className="card-label">Формат работы</span>
                <strong>Заявки, выезд, сопровождение</strong>
              </div>
              <button className="ghost-btn" type="button" onClick={handleDownloadPrice} disabled={downloadingPdf}>
                {downloadingPdf ? 'Готовим PDF...' : 'Скачать прайс'}
              </button>
            </div>
          </div>
        </section>

        <section className="metrics-row">
          <article className="metric-card">
            <span>Скорость</span>
            <strong>От заявки до работы без пауз</strong>
          </article>
          <article className="metric-card">
            <span>Контроль</span>
            <strong>Статусы, даты и уведомления в одном месте</strong>
          </article>
          <article className="metric-card">
            <span>Прозрачность</span>
            <strong>Прайс и список услуг доступны сразу</strong>
          </article>
        </section>

        <section className="section" id="services">
          <div className="section-head">
            <div>
              <p className="eyebrow">Услуги</p>
              <h2>То, что можно заказать прямо с сайта</h2>
            </div>
            <button className="ghost-btn" type="button" onClick={handleDownloadPrice} disabled={downloadingPdf}>
              {downloadingPdf ? 'Скачиваем...' : 'Прайс PDF'}
            </button>
          </div>

          {servicesError ? (
            <p className="empty-state">{servicesError}</p>
          ) : !servicesLoading && services.length === 0 ? (
            <p className="empty-state">Пока нет услуг. Добавьте их через manager-панель.</p>
          ) : (
            <div className="services-grid">
              {servicesLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <article key={index} className="service-card skeleton">
                      <span className="skeleton-line short" />
                      <span className="skeleton-line" />
                    </article>
                  ))
                : services.slice(0, 6).map((service) => (
                    <article key={service.id} className="service-card">
                      <span className="service-tag">Популярно</span>
                      <h3>{service.name}</h3>
                      <p>Быстрый расчет, аккуратный монтаж и сопровождение работ.</p>
                      <strong>{formatPrice(service.price)} тг.</strong>
                    </article>
                  ))}
            </div>
          )}
        </section>

        <section className="section section--split" id="process">
          <div className="process-panel">
            <p className="eyebrow">Как это работает</p>
            <h2>Три шага до готовой заявки</h2>
            <ol className="process-list">
              <li>
                <strong>1. Регистрация</strong>
                <span>Создаете аккаунт магазина и заполняете профиль.</span>
              </li>
              <li>
                <strong>2. Заявка</strong>
                <span>Выбираете услугу, описываете задачу и отправляете ее менеджеру.</span>
              </li>
              <li>
                <strong>3. Контроль</strong>
                <span>Следите за статусами, датами работ и уведомлениями в личном кабинете.</span>
              </li>
            </ol>
          </div>

          <div className="contacts-panel" id="contacts">
            <p className="eyebrow">Контакты</p>
            <h2>Все на одной странице</h2>
            <p>
              Если нужен аккуратный сайт для сервиса и заявок, этот сценарий уже закрывает
              главную, кабинет, услуги и рабочую панель менеджера.
            </p>
            <div className="contact-lines">
              <span>Поддержка заявок</span>
              <strong>через личный кабинет</strong>
            </div>
            <div className="contact-lines">
              <span>Прайс-лист</span>
              <strong>доступен в PDF</strong>
            </div>
            <div className="contact-lines">
              <span>Старт</span>
              <strong>за пару минут после регистрации</strong>
            </div>
          </div>
        </section>

        <section className="section cta-panel">
          <div>
            <p className="eyebrow">Готовы начать</p>
            <h2>Откройте кабинет и отправьте первую заявку</h2>
            <p>
              После входа вы увидите профиль магазина, заявки, уведомления и быстрый заказ услуг.
            </p>
          </div>

          <div className="cta-actions">
            <Link className="primary-btn" to="/register">
              Зарегистрироваться
            </Link>
            <Link className="secondary-btn" to="/login">
              Уже есть аккаунт
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
