import scss from "./Registr.module.scss";
import Cor from "../../assets/corridor.svg";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, getCurrentRole } from "../../api";

const Registr = ({ onAuthChange }) => {
  const [shopName, setShopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getRegisterErrorMessage = (err) => {
    if (!err) return "Ошибка регистрации. Попробуйте снова.";
    if (typeof err === "string") return err;
    if (err.message === 'Не удалось подключиться к серверу') {
      return 'Сервер API недоступен. Запустите Django backend на 8000.';
    }
    if (err.email?.[0]) return `Email: ${err.email[0]}`;
    if (err.number?.[0]) return `Телефон: ${err.number[0]}`;
    if (err.password?.[0]) return `Пароль: ${err.password[0]}`;
    if (err.non_field_errors?.[0]) return err.non_field_errors[0];
    if (err.detail) return err.detail;
    return "Не удалось зарегистрироваться. Проверьте данные и попробуйте снова.";
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = getCurrentRole();
    if (token) {
      if (role === 'manager') {
        navigate("/manager/orders");
      } else {
        navigate("/");
      }
    }
  }, [navigate]);

  const handleRegister = async () => {
    if (!shopName.trim() || !fullName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({
        shop_name: shopName,
        full_name: fullName,
        number: phone,
        email: email,
        password: password,
      });
      if (onAuthChange) onAuthChange();
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !shopName.trim() || !fullName.trim() || !phone.trim() ||
                     !email.trim() || !password.trim() || loading;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isDisabled) handleRegister();
  };

  return (
    <section className={scss.Registr}>
      <div className={scss.contai_image}>
        <img className={scss.Cor} src={Cor} alt="" />
      </div>

      <div className={scss.contai_Title}>
        <div className={scss.Aftoris}>
          <Link to="/login">Авторизация</Link>
        </div>

        <h2>
          Добро пожаловать в службу <br /> <span>сервиса PRO Монтаж.</span>
        </h2>

        <div className={scss.contai_input}>
          <p>Регистрация</p>

          <div className={scss.contai_value}>
            <input value={shopName} onChange={(e) => setShopName(e.target.value)}
              onKeyDown={handleKeyDown} type="text" placeholder="Название магазина" />
          </div>
          <div className={scss.contai_value}>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              onKeyDown={handleKeyDown} type="text" placeholder="ФИО менеджера" />
          </div>
          <div className={scss.contai_value}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleKeyDown} type="tel" placeholder="Контактный телефон" />
          </div>
          <div className={scss.contai_value}>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown} type="email" placeholder="Email" />
          </div>
          <div className={scss.contai_value}>
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown} type="password" placeholder="Пароль" />
          </div>

          {error && <p className={scss.errorText}>{error}</p>}
        </div>

        <button onClick={handleRegister} disabled={isDisabled}>
          {loading ? "Регистрируем..." : "Зарегистрироваться"}
        </button>
      </div>
    </section>
  );
};

export default Registr;
