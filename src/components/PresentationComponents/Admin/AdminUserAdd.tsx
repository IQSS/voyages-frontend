import { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import AdminHeader from './AdminHeader';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormErrors {
  username?: string;
  password1?: string;
  password2?: string;
}

// ── Reusable form-row ─────────────────────────────────────────────────────────
const FormRow: React.FC<{
  id: string;
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ id, label, required, helpText, error, children }) => (
  <div
    className="form-row"
    style={{
      overflow: 'hidden',
      padding: '10px',
      fontSize: 13,
      borderBottom: '1px solid #eee',
    }}
  >
    <div style={{ overflow: 'hidden' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          padding: '4px 10px 0 0',
          float: 'left',
          width: 160,
          wordWrap: 'break-word',
          lineHeight: 1,
          fontWeight: required ? 'bold' : 'normal',
          color: required ? '#333' : '#666',
          fontSize: 13,
        }}
      >
        {label}:
        {required && <span style={{ color: '#c00', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ marginLeft: 170 }}>
        {children}
        {error && (
          <ul
            style={{
              margin: '4px 0 0 0',
              padding: 0,
              listStyle: 'none',
            }}
          >
            <li
              style={{
                fontSize: 12,
                display: 'block',
                padding: '4px 5px 4px 25px',
                border: '1px solid red',
                color: 'white',
                background: `red url(https://legacy.slavevoyages.org/static/admin/img/icon_alert.gif) 5px 0.3em no-repeat`,
              }}
            >
              {error}
            </li>
          </ul>
        )}
        {helpText && (
          <p
            className="help"
            style={{
              fontSize: 10,
              color: '#999',
              margin: '4px 0 0 0',
              padding: 0,
            }}
          >
            {helpText}
          </p>
        )}
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminUserAdd: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '20em',
    border: '1px solid #ccc',
    padding: '2px 3px',
    fontSize: 11,
    fontFamily: '"Lucida Grande",Verdana,Arial,sans-serif',
    verticalAlign: 'middle',
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!username.trim()) e.username = 'This field is required.';
    else if (username.length < 3)
      e.username = 'Username must be at least 3 characters.';
    if (!password1) e.password1 = 'This field is required.';
    else if (password1.length < 8)
      e.password1 =
        'This password is too short. It must contain at least 8 characters.';
    if (!password2) e.password2 = 'This field is required.';
    else if (password1 !== password2)
      e.password2 = "The two password fields didn't match.";
    return e;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaved(true);
    // After save, navigate back to user list
    setTimeout(() => navigate('/admin/auth/user/'), 800);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
        fontSize: 13,
        color: '#333',
        width: '85%',
        padding: '10px 20px',
      }}
    >
      <AdminHeader />
      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ margin: '10px auto', padding: '0px 15px' }}>
        {/* Object tools */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 4px 0',
            float: 'right',
            display: 'flex',
            gap: 4,
          }}
        >
          <li>
            <Link to="/admin/auth/user/">
              <button
                style={{
                  display: 'inline-block',
                  padding: '5px 10px',
                  background: 'rgb(55, 148, 141)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  borderRadius: 4,
                  border: '1px solid rgb(0 172 159)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.background =
                    'rgb(0 172 159)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.background =
                    'rgb(55, 148, 141)')
                }
              >
                ← Back to Users
              </button>
            </Link>
          </li>
        </ul>

        <h1
          style={{
            fontSize: 18,
            color: '#666',
            margin: '0 0 16px 0',
            fontWeight: 'bold',
            clear: 'none',
          }}
        >
          Add user
        </h1>

        {/* Success message */}
        {saved && (
          <ul style={{ padding: 0, margin: '0 0 10px 0' }}>
            <li
              style={{
                fontSize: 12,
                display: 'block',
                padding: '4px 5px 4px 25px',
                marginBottom: 3,
                borderBottom: '1px solid #ddd',
                color: '#666',
                background: `rgb(55, 148, 141) 5px 0.3em no-repeat`,
                listStyle: 'none',
              }}
            >
              The user &quot;<strong>{username}</strong>&quot; was added
              successfully.
            </li>
          </ul>
        )}

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSave} noValidate>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            First, enter a username and password. Then, you&apos;ll be able to
            edit more user options.
          </p>

          {/* Fieldset */}
          <fieldset
            className="module aligned"
            style={{
              border: '1px solid #ccc',
              marginBottom: 20,
              background: 'white',
              padding: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                padding: '2px 5px 3px 5px',
                fontSize: 11,
                textAlign: 'left',
                fontWeight: 'bold',
                background: 'rgb(55, 148, 141)',
                color: 'white',
              }}
            >
              &nbsp;
            </h2>

            {/* Username */}
            <FormRow
              id="id_username"
              label="Username"
              required
              error={errors.username}
              helpText="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
            >
              <input
                id="id_username"
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={150}
                style={{
                  ...inputStyle,
                  borderColor: errors.username ? 'red' : '#ccc',
                  background: errors.username ? '#ffc' : '#fff',
                }}
              />
            </FormRow>

            {/* Password */}
            <FormRow
              id="id_password1"
              label="Password"
              required
              error={errors.password1}
              helpText="Your password must contain at least 8 characters."
            >
              <input
                id="id_password1"
                type="password"
                name="password1"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.password1 ? 'red' : '#ccc',
                  background: errors.password1 ? '#ffc' : '#fff',
                }}
              />
            </FormRow>

            {/* Password confirmation */}
            <FormRow
              id="id_password2"
              label="Password confirmation"
              required
              error={errors.password2}
              helpText="Enter the same password as before, for verification."
            >
              <input
                id="id_password2"
                type="password"
                name="password2"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.password2 ? 'red' : '#ccc',
                  background: errors.password2 ? '#ffc' : '#fff',
                }}
              />
            </FormRow>
          </fieldset>

          {/* ── Submit row ────────────────────────────────────────────── */}
          <div
            className="submit-row"
            style={{
              padding: '12px 14px',
              margin: '0 0 20px',
              background: '#f8f8f8',
              border: '1px solid #eee',
              borderRadius: 4,
              overflow: 'hidden',
              textAlign: 'right',
            }}
          >
            <button
              type="submit"
              className="default"
              style={{
                height: 35,
                lineHeight: '15px',
                margin: '0 0 0 8px',
                padding: '0 15px',
                border: '1px solid #007269',
                background: 'rgb(55, 148, 141)',
                fontWeight: 'bold',
                color: 'white',
                fontSize: 13,
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: 4,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLInputElement).style.background =
                  'rgb(0 172 159)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLInputElement).style.background =
                  'rgb(55, 148, 141)')
              }
            >
              Save
            </button>
            <button
              type="button"
              style={{
                height: 35,
                lineHeight: '15px',
                margin: '0 0 0 5px',
                padding: '0 12px',
                border: '1px solid #bbb',
                background: '#e8e8e8',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 3,
                color: '#333',
              }}
              onClick={() => {
                const errs = validate();
                if (Object.keys(errs).length > 0) {
                  setErrors(errs);
                  return;
                }
                setUsername('');
                setPassword1('');
                setPassword2('');
                setErrors({});
              }}
            >
              Save and add another{' '}
            </button>
            <button
              type="button"
              style={{
                height: 35,
                lineHeight: '15px',
                margin: '0 0 0 5px',
                padding: '0 12px',
                border: '1px solid #bbb',
                background: '#e8e8e8',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 3,
                color: '#333',
              }}
              onClick={handleSave}
            >
              Save and continue editing{' '}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserAdd;
