import scss from "./Aftoris.module.scss";
import Cor from "../../assets/corridor.svg";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../api";

// FIX: принимает onAuthChange чтобы App обновил isAuth стейт после логина
const Aftoris = ({ onAuthChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getLoginErrorMessage = (err) => {
    if (!err) return "Ошибка входа. Попробуйте снова.";
    if (typeof err === "string") return err;
    if (err.message === 'Не удалось подключиться к серверу') {
      return 'Сервер API недоступен. Запустите Django backend на 8000.';
    }
    if (err.detail) return err.detail;
    if (err.non_field_errors?.[0]) return err.non_field_errors[0];
    if (err.email?.[0]) return err.email[0];
    return "Неверный email или пароль.";
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      // FIX: уведомляем App об изменении auth стейта
      if (onAuthChange) onAuthChange();
      if (data.role === "manager") {
        navigate("/manager/orders");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !email.trim() || !password.trim() || loading;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isDisabled) handleLogin();
  };

  return (
    <section className={scss.Aftoris}>
      <div className={scss.contai_image}>
        <img className={scss.Cor} src={Cor} alt="" />
      </div>

      <div className={scss.contai_Title}>
        <div className={scss.Registr}>
          <Link to="/register">Регистрация</Link>
        </div>

        <h2>
          Добро пожаловать в службу <br /> <span>сервиса PRO Монтаж.</span>
        </h2>

        <div className={scss.contai_input}>
          <p>Авторизация</p>

          <div className={scss.contai_value}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              type="email"
              placeholder="Email"
            />
          </div>

          <div className={scss.contai_value}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              type="password"
              placeholder="Пароль"
            />
          </div>

          {error && <p className={scss.errorText}>{error}</p>}
        </div>

        <button onClick={handleLogin} disabled={isDisabled}>
          {loading ? "Входим..." : "Войти"}
        </button>
      </div>
    </section>
  );
};

export default Aftoris;
