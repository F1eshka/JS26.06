class Base64 {
    static createCredentials(login, password) {
      if (login.includes(":")) {
        throw new Error("Логін не повинен містити ':'");
      }
      const raw = `${login}:${password}`;
      const encoded = btoa(unescape(encodeURIComponent(raw)));
      return `Basic ${encoded}`;
    }
  
    static parseCredentials(credentials) {
      if (!credentials.startsWith("Basic ")) {
        throw new Error("Невірний формат credentials");
      }
      const encoded = credentials.slice(6);
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const index = decoded.indexOf(":");
      if (index === -1) {
        throw new Error("Некоректне декодування — відсутній ':'");
      }
      return {
        login: decoded.slice(0, index),
        password: decoded.slice(index + 1)
      };
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logout");
    const authInfo = document.getElementById("authInfo");
    const username = document.getElementById("username");
    const issued = document.getElementById("issued");
    const expires = document.getElementById("expires");
    const interval = document.getElementById("interval");
  
    let intervalId = null;
  
    const TOKEN_KEY = "authToken";
  
    function saveToken(login, password) {
      const credentials = Base64.createCredentials(login, password);
      const issuedTime = new Date();
      const expiresTime = new Date(issuedTime.getTime() + 60 * 60 * 1000); // +1 година
  
      const payload = {
        credentials,
        user: login,
        issued: issuedTime.toISOString(),
        expires: expiresTime.toISOString()
      };
  
      localStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
      renderToken();
    }
  
    function renderToken() {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return;
  
      try {
        const token = JSON.parse(raw);
        const creds = Base64.parseCredentials(token.credentials);
  
        const issuedDate = new Date(token.issued);
        const expiresDate = new Date(token.expires);
  
        username.textContent = creds.login;
        issued.textContent = issuedDate.toLocaleString();
        expires.textContent = expiresDate.toLocaleString();
  
        authInfo.style.display = "block";
        logoutBtn.style.display = "inline-block";
        loginForm.style.display = "none";
  
        updateRemaining();
        intervalId = setInterval(updateRemaining, 1000);
  
        function updateRemaining() {
          const now = new Date();
          const diff = expiresDate - now;
  
          if (diff <= 0) {
            logout("Сесію завершено.");
            return;
          }
  
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          interval.textContent = ` (залишилось ${mins}хв ${secs}сек)`;
        }
  
      } catch (e) {
        logout("Помилка токена.");
      }
    }
  
    function logout(message) {
      if (intervalId) clearInterval(intervalId);
      localStorage.removeItem(TOKEN_KEY);
      alert(message);
      authInfo.style.display = "none";
      logoutBtn.style.display = "none";
      loginForm.style.display = "flex";
    }
  
    logoutBtn.addEventListener("click", () => logout("Вихід виконано."));
  
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const login = document.getElementById("login").value.trim();
      const password = document.getElementById("password").value;
      try {
        saveToken(login, password);
      } catch (e) {
        alert(e.message);
      }
    });
  
    renderToken();
  });
  