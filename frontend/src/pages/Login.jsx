import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./Login.css";

function Login() {
  const { loginWithRedirect } = useAuth0();

  const handleAuth0Login = async () => {
    try {
      await loginWithRedirect();
    } catch (error) {
      console.error("Login redirect error:", error);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>

      <div className="login-card">
        <div className="brand-badge">☁️</div>

        <h1>Cloud Task Manager</h1>
        <p className="login-tagline">
          Secure multi-cloud workspace for your tasks, powered by Auth0, MongoDB & Dropbox.
        </p>

        <div className="login-services-pill">
          <span className="tech-tag">MongoDB Atlas</span>
          <span className="tech-tag">Auth0</span>
          <span className="tech-tag">Dropbox</span>
        </div>

        <button className="auth-action-btn" onClick={handleAuth0Login}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
            alt="Auth0 / Google"
            className="auth-icon"
          />
          <span>Sign In with Auth0</span>
        </button>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-check">✦</span>
            <span>Real-time Cloud Database synchronization</span>
          </div>
          <div className="feature-item">
            <span className="feature-check">✦</span>
            <span>Dropbox Cloud storage for file attachments</span>
          </div>
          <div className="feature-item">
            <span className="feature-check">✦</span>
            <span>Encrypted authentication & per-user isolation</span>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        © 2026 Cloud Task Manager • Engineered with Cloud Services
      </footer>
    </div>
  );
}

export default Login;