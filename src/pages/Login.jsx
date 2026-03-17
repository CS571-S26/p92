import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [cannotBeEmptyError, setCannotBeEmptyError] = useState(false);


  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);


  const [emailError, setEmailError] = useState(false);
  const [goodEmail, setGoodEmail] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (email.length > 0) {
      setEmailError(!validateEmail(email));
      if (emailError && email.length !== 0) {
        setGoodEmail(true);

        clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          setGoodEmail(false);
        }, 5000);
      }
    } else {
      setGoodEmail(false);
      setEmailError(false);
    }
  }, [email]);


  useEffect(() => {
    if (password.length === 0 && passwordTouched) {
      setPasswordError(true);
    }
    else setPasswordError(false);
  }, [password.length]);

  useEffect(() => {
    if (email.length === 0 && emailTouched) {
      setCannotBeEmptyError(true);
    }
    else setCannotBeEmptyError(false);
  }, [email.length]);


  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    if (!validateEmail(email)) return;

    console.log("Logging in with:", { email, password })
    sendLoginRequest();
  }

  function sendLoginRequest() {
    const SILENT = new Error('SILENT');
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
      .then(response => {

        if (response.status === 401) {
          alert('Unauthorized: Invalid email or password');
          throw SILENT;
        }
        else if (!response.ok) {
          throw new Error('dk but something went wrong!')
        }

        return response.json();
      }
      )
      .then(data => {
        console.log('Login successful:', data);
        navigate('/home');
      })
      .catch(error => {
        if (error === SILENT) return;
        console.error(error);
      }
      );
  }



  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-zinc-400 mb-1 text-sm" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 rounded bg-black text-white border border-zinc-800 focus:outline-none focus:border-zinc-600 text-sm"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailTouched(true);
              }}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">Invalid Email! 😿</p>}
            {cannotBeEmptyError && !emailError && <p className="text-red-500 text-xs mt-1">Email’s missing… bruh 💀</p>}
            {goodEmail && !emailError && <p className="text-green-500 text-xs mt-1">Thank you! 😊</p>}
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 rounded bg-black text-white border border-zinc-800 focus:outline-none focus:border-zinc-600 text-sm"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordTouched(true);
              }
              }
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">Passwords really cannot be empty! 😾</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black py-2 rounded font-semibold hover:bg-zinc-200 transition-colors text-sm mt-2"
            onClick={handleSubmit}
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-zinc-500 text-sm">
          Not registered yet?{" "}
          <button
            type="button"
            className="text-white underline hover:text-zinc-300 transition-colors"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
