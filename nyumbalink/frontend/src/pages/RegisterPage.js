import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', username: '', phone: '',
    role: 'tenant', password: '', password2: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const firstError = data
        ? Object.values(data).flat()[0]
        : 'Registration failed.';
      setError(firstError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>🏠 Create Account</h1>
        <p className={styles.subtitle}>Join Hausio — verified rentals in Nairobi</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>I am a</label>
            <select
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="tenant">Tenant — looking for a house</option>
              <option value="landlord">Landlord — listing my property</option>
            </select>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@example.com"
              />
            </div>
            <div className={styles.field}>
              <label>Username</label>
              <input
                required
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                placeholder="johndoe"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="0712 345 678"
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            <div className={styles.field}>
              <label>Confirm Password</label>
              <input
                type="password" required
                value={form.password2}
                onChange={e => setForm({...form, password2: e.target.value})}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;