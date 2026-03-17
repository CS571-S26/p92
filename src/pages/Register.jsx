import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [cannotBeEmptyError, setCannotBeEmptyError] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  useEffect(() => {
    if (email.length > 0) {
      setEmailError(!validateEmail(email));
    } else {
      setEmailError(false);
    }
  }, [email]);

  useEffect(() => {
    if (email.length === 0 && emailTouched) {
      setCannotBeEmptyError(true);
    } else {
      setCannotBeEmptyError(false);
    }
  }, [email.length]);

  useEffect(() => {
    if (password.length === 0 && passwordTouched) {
      setPasswordError(true);
    } else {
      setPasswordError(false);
    }
  }, [password.length]);

  useEffect(() => {
    if (confirmPasswordTouched) {
      if (confirmPassword.length === 0) {
        setConfirmPasswordError(true);
      } else if (confirmPassword !== password) {
        setConfirmPasswordError(true);
      } else {
        setConfirmPasswordError(false);
      }
    }
  }, [confirmPassword, password]);

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    if (!validateEmail(email)) return;
    if (password !== confirmPassword) return;

    console.log("Registering with:", { email, password });
    sendRegisterRequest();
  }

  function sendRegisterRequest() {
    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
      .then(response => {
        if (!response.ok) {
          alert('Registration Failed: ' + response.statusText);
          throw new Error('Registration failed');
        }
        return response.json();
      })
      .then(data => {
        console.log('Registration successful:', data);
        navigate('/login');
      })
      .catch(error => {
        console.error('Error during registration:', error);
      });
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6">Register</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-zinc-400 mb-1 text-sm" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 rounded bg-black text-white border border-zinc-800 focus:outline-none focus:border-zinc-600 text-sm"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTouched(true);
              }}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">Invalid email address.</p>}
            {cannotBeEmptyError && !emailError && <p className="text-red-500 text-xs mt-1">Email cannot be empty.</p>}
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 rounded bg-black text-white border border-zinc-800 focus:outline-none focus:border-zinc-600 text-sm"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordTouched(true);
              }}
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">Password cannot be empty.</p>}
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm" htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              className="w-full px-3 py-2 rounded bg-black text-white border border-zinc-800 focus:outline-none focus:border-zinc-600 text-sm"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordTouched(true);
              }}
            />
            {confirmPasswordError && confirmPassword.length === 0 && (
              <p className="text-red-500 text-xs mt-1">Please confirm your password.</p>
            )}
            {confirmPasswordError && confirmPassword.length > 0 && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black py-2 rounded font-semibold hover:bg-zinc-200 transition-colors text-sm mt-2"
            onClick={handleSubmit}
          >
            Register
          </button>
        </form>
        <p className="mt-6 text-center text-zinc-500 text-sm">
          Already have an account?{" "}
          <button
            type="button"
            className="text-white underline hover:text-zinc-300 transition-colors"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
