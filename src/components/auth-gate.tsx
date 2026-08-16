import { useEffect, useState } from 'react';

const LOGIN = import.meta.env.VITE_AUTH_LOGIN;
const PASSWORD = import.meta.env.VITE_AUTH_PASSWORD;
const STORAGE_KEY = 'job-crm-auth';

function isAuthed() {
  return localStorage.getItem(STORAGE_KEY) === 'ok';
}

/**
 * Bare-minimum gate for a single-user tool deployed to a public URL — just
 * enough to keep random visitors out via browser prompt()/alert(). Not real
 * security: the credentials ship in the client bundle.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(isAuthed);

  useEffect(() => {
    if (authed) return;
    while (true) {
      const login = window.prompt('Login:');
      const password = window.prompt('Password:');
      if (login === LOGIN && password === PASSWORD) {
        localStorage.setItem(STORAGE_KEY, 'ok');
        setAuthed(true);
        return;
      }
      window.alert('Wrong login or password');
    }
  }, [authed]);

  if (!authed) return null;
  return children;
}
