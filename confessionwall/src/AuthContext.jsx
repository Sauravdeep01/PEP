import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ---------------------------------------------------------------
   AuthContext – wraps Google OAuth 2.0 (GSI / google accounts)
   The Google Identity Services script is loaded in index.html.
--------------------------------------------------------------- */

const AuthContext = createContext(null);

export function AuthProvider({ children, clientId }) {
    const [user, setUser] = useState(null);   // { id, name, email, picture, firstName }
    const [isLoaded, setIsLoaded] = useState(false);

    /* ----------------------------------------------------------
       Restore session from localStorage on first mount
    ---------------------------------------------------------- */
    useEffect(() => {
        const stored = localStorage.getItem('google_user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Migration: If authType is missing, assume it's Google (legacy default)
                if (!parsed.authType) {
                    parsed.authType = parsed.idToken ? 'google' : 'manual';
                }
                setUser(parsed);
            } catch (_) { }
        }
        setIsLoaded(true);
    }, []);

    /* ----------------------------------------------------------
       Parse a Google JWT credential into a plain user object
    ---------------------------------------------------------- */
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (_) {
            return null;
        }
    };

    /* ----------------------------------------------------------
       Called by Google after the user picks an account
    ---------------------------------------------------------- */
    const handleCredentialResponse = useCallback((response) => {
        const payload = parseJwt(response.credential);
        if (!payload) return;

        const userObj = {
            id: payload.sub,           // Google's unique user ID
            name: payload.name,
            firstName: payload.given_name,
            email: payload.email,
            picture: payload.picture,
            idToken: response.credential,   // raw JWT – send to backend for verification
            authType: 'google'
        };

        setUser(userObj);
        localStorage.setItem('google_user', JSON.stringify(userObj));
    }, []);

    /* ----------------------------------------------------------
       Manual Login / Signup
    ---------------------------------------------------------- */
    const manualAuth = useCallback(async (email, username) => {
        try {
            const res = await fetch(`http://127.0.0.1:5001/users/manual-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const userObj = {
                id: data.googleId || data.customUserId, // Use custom ID if no google ID
                name: data.username,
                firstName: data.username.split(' ')[0],
                email: data.email,
                picture: data.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                authType: 'manual'
            };

            setUser(userObj);
            localStorage.setItem('google_user', JSON.stringify(userObj));
            return { success: true };
        } catch (err) {
            console.error('Manual auth failed:', err);
            return { success: false, error: err.message };
        }
    }, []);

    /* ----------------------------------------------------------
       Initialize Google ID once when library is available
    ---------------------------------------------------------- */
    useEffect(() => {
        const initGoogle = () => {
            if (window.google && clientId) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    ux_mode: 'popup',
                    use_fedcm_for_prompt: false, // Set to false to bypass 'FedCM disabled' browser warnings
                });
            }
        };

        if (window.google) {
            initGoogle();
        } else {
            // Fallback if script loads later
            const interval = setInterval(() => {
                if (window.google) {
                    initGoogle();
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [clientId, handleCredentialResponse]);

    /* ----------------------------------------------------------
       Trigger the Google One-Tap / popup sign-in flow
    ---------------------------------------------------------- */
    const signIn = useCallback(() => {
        if (!window.google) {
            console.error('Google Identity Services not loaded.');
            return;
        }
        window.google.accounts.id.prompt(); // show One-Tap if eligible
    }, []);

    /* ----------------------------------------------------------
       Show the explicit "Sign in with Google" button inside a div
    ---------------------------------------------------------- */
    const renderGoogleButton = useCallback((containerId, opts = {}) => {
        if (!window.google) return;

        // Ensure the element exists before rendering
        const container = document.getElementById(containerId);
        if (container) {
            window.google.accounts.id.renderButton(
                container,
                { theme: 'outline', size: 'large', ...opts }
            );
        }
    }, []);

    /* ----------------------------------------------------------
       Sign-out: clear local state + revoke Google session
    ---------------------------------------------------------- */
    const signOut = useCallback(() => {
        if (window.google && user?.email) {
            // Optional: call initialize before revoke if you want to be extra safe
            // window.google.accounts.id.initialize({ client_id: clientId, callback: () => {} });
            window.google.accounts.id.revoke(user.email, () => {
                console.log('Google session revoked');
            });
        }
        setUser(null);
        localStorage.removeItem('google_user');
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, isLoaded, signIn, signOut, renderGoogleButton, manualAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

/* Hook */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
