import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = '/api';

// Build-time demo mode flag — matches api.ts
declare const __DEMO_MODE__: boolean;
const IS_DEMO_MODE = typeof __DEMO_MODE__ !== 'undefined' ? __DEMO_MODE__ : false;

const DEMO_ADMIN: User = {
  id: 1,
  email: 'superadmin@internsystem.com',
  role: 'super_admin',
};

const DEMO_INTERN: User = {
  id: 2,
  email: 'intern@example.com',
  role: 'intern',
  internId: 1,
  internCode: 'INT-2024-12345',
  approvalStatus: 'approved',
};

// ─── storage helpers ───────────────────────────────────────────────────────────
// All auth state lives in sessionStorage (cleared on tab close).
// This matches api.ts and prevents XSS token theft via localStorage.
const storage = {
  get: (key: string) => sessionStorage.getItem(key),
  set: (key: string, value: string) => sessionStorage.setItem(key, value),
  remove: (key: string) => sessionStorage.removeItem(key),
  clear: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('user');
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(storage.get('token'));
  const [sessionToken, setSessionToken] = useState<string | null>(storage.get('sessionToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode] = useState(IS_DEMO_MODE);

  useEffect(() => {
    if (IS_DEMO_MODE) {
      const savedUser = storage.get('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setLoading(false);
      return;
    }

    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        storage.clear();
        setToken(null);
        setSessionToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        storage.set('user', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        storage.clear();
        setToken(null);
        setSessionToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      storage.clear();
      setToken(null);
      setSessionToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const getGPSLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => { console.warn('GPS error:', err); resolve(null); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';
    return { browser, os, device: ua };
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Demo mode — no real network call
      if (IS_DEMO_MODE) {
        if (email === 'superadmin@internsystem.com' && password === 'Admin@123') {
          storage.set('user', JSON.stringify(DEMO_ADMIN));
          setUser(DEMO_ADMIN);
        } else if (email === 'intern@example.com' && password === 'Intern@123') {
          storage.set('user', JSON.stringify(DEMO_INTERN));
          setUser(DEMO_INTERN);
        } else {
          throw new Error('Demo credentials: superadmin@internsystem.com / Admin@123  |  intern@example.com / Intern@123');
        }
        setLoading(false);
        return;
      }

      const gpsLocation = await getGPSLocation();
      const deviceInfo = getDeviceInfo();

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          accuracy: gpsLocation?.accuracy,
          deviceInfo,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Backend server is not running. Please start the server with: npm run server');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      // Store everything in sessionStorage
      storage.set('token', data.token);
      storage.set('sessionToken', data.sessionToken);
      storage.set('user', JSON.stringify(data.user));

      setToken(data.token);
      setSessionToken(data.sessionToken);
      setUser(data.user);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!IS_DEMO_MODE && token && sessionToken) {
      try {
        const gpsLocation = await getGPSLocation();
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionToken,
            latitude: gpsLocation?.latitude,
            longitude: gpsLocation?.longitude,
            accuracy: gpsLocation?.accuracy,
          }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    storage.clear();
    setToken(null);
    setSessionToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, sessionToken, login, logout, loading, error, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
