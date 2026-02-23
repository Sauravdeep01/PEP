import './App.css'
import { useAuth } from './AuthContext';
import ConfessionWall from './components/ConfessionWall';
import Widgets from './components/Widgets';
import UserProfile from './components/UserProfile';
import { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:5001/confessions';

function App() {
  const { user, isLoaded, signIn, signOut, renderGoogleButton, manualAuth } = useAuth();

  const [activeView, setActiveView] = useState('feed');
  const [confessions, setConfessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');

  // Manual Login Form State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualUsername, setManualUsername] = useState('');
  const [manualError, setManualError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError('');
    if (!manualEmail || !manualUsername) {
      setManualError('Both fields are required.');
      return;
    }
    setIsAuthenticating(true);
    const result = await manualAuth(manualEmail, manualUsername);
    if (!result.success) {
      setManualError(result.error);
    }
    setIsAuthenticating(false);
  };

  const fetchUserAnonName = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://127.0.0.1:5001/users/${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setAnonymousName(data.anonymousName || '');
    } catch (err) {
      console.error('Failed to fetch anonymous name:', err);
    }
  };

  const fetchConfessions = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setConfessions(data);
    } catch (err) {
      console.error('Failed to fetch confessions:', err);
    }
  };

  const notifications = confessions
    .filter(c => c.userId === user?.id)
    .reduce((acc, c) => {
      (c.reactions || []).forEach(r => {
        if (r.userId !== user?.id) {
          acc.push({
            id: `react-${r._id}-${c._id}`,
            text: `Someone reacted with ${r.type === 'like' ? '👍' : r.type === 'love' ? '❤️' : '😂'} to your confession`,
            time: c.updatedAt,
            type: 'reaction'
          });
        }
      });
      (c.comments || []).forEach(com => {
        if (com.userId !== user?.id) {
          acc.push({
            id: `comment-${com._id}`,
            text: `${com.userName} commented on your post`,
            time: com.createdAt,
            type: 'comment'
          });
        }
      });
      return acc;
    }, [])
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10);

  const syncUserWithDB = async () => {
    if (!user || user.authType === 'manual') return; // Don't sync manual users via this route
    try {
      await fetch(`http://127.0.0.1:5001/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: user.id,
          email: user.email,
          username: user.name
        })
      });
      fetchUserAnonName();
    } catch (err) {
      console.error('Failed to sync user:', err);
    }
  };

  const [hasSynced, setHasSynced] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);

  useEffect(() => {
    fetchConfessions();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.authType === 'google' && !hasSynced) {
        syncUserWithDB();
        setHasSynced(true);
      } else {
        fetchUserAnonName();
      }
    } else if (isLoaded && !user && !buttonRendered) {
      const timer = setTimeout(() => {
        renderGoogleButton('google-signin-button', {
          theme: 'filled_blue',
          size: 'large',
          width: '320',
          shape: 'pill'
        });
        setButtonRendered(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoaded, hasSynced, buttonRendered, renderGoogleButton]);

  useEffect(() => {
    if (!user) {
      setHasSynced(false);
      setButtonRendered(false);
    }
  }, [user]);

  const renderContent = () => {
    switch (activeView) {
      case 'feed':
        return (
          <div className="content-grid">
            <ConfessionWall
              confessions={confessions.filter(c => {
                const query = searchTerm.toLowerCase();
                if (!query) return true;
                if (query.startsWith('#')) {
                  const tag = query.slice(1);
                  return c.category?.toLowerCase().includes(tag);
                }
                return (
                  c.text.toLowerCase().includes(query) ||
                  c.category?.toLowerCase().includes(query)
                );
              })}
              refreshData={fetchConfessions}
              currentAnonName={anonymousName}
            />
            <Widgets confessions={confessions} onSearch={setSearchTerm} />
          </div>
        );
      case 'news':
        return (
          <div className="content-grid">
            <ConfessionWall
              confessions={confessions.filter(c => c.category === 'News')}
              refreshData={fetchConfessions}
              currentAnonName={anonymousName}
            />
            <Widgets confessions={confessions} onSearch={setSearchTerm} />
          </div>
        );
      case 'profile':
        return (
          <UserProfile
            confessions={confessions}
            onNameUpdate={fetchUserAnonName}
          />
        );
      case 'rules':
        return (
          <div className="info-page">
            <h2>📜 ConfessHub Rules</h2>
            <div className="info-card">
              <p>Welcome to ConfessHub. To maintain a healthy community, please follow these rules:</p>
              <ul>
                <li><strong>Respect Anonymity:</strong> Do not attempt to de-anonymize or doxx other users.</li>
                <li><strong>No Hate Speech:</strong> We do not tolerate harassment, bullying, or hate speech against any group or individual.</li>
                <li><strong>No Spam:</strong> Avoid posting the same confession multiple times or filling the feed with meaningless content.</li>
                <li><strong>Legal Content Only:</strong> Do not post illegal content or material that promotes harm.</li>
                <li><strong>Use Categories:</strong> Please select the most relevant category for your post to help others find it.</li>
              </ul>
              <p>Failure to follow these rules may result in the removal of your posts or a permanent ban.</p>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="info-page">
            <h2>🔒 Privacy Policy</h2>
            <div className="info-card">
              <p>At ConfessHub, your privacy is our top priority. Here is how we handle your data:</p>
              <ul>
                <li><strong>Anonymous Posting:</strong> Your Google User ID is stored to allow you to manage your posts, but it is never revealed to other users.</li>
                <li><strong>Secret Codes:</strong> Edit/Delete functions are protected by your manual secret code, which we hash for security.</li>
                <li><strong>Minimal Tracking:</strong> We only store what is necessary for the application to function. We do not sell your personal data.</li>
                <li><strong>Data Control:</strong> You can delete your confessions at any time with your secret code.</li>
              </ul>
              <p>By using this platform, you agree to our approach to privacy and data handling.</p>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="info-page">
            <h2>ℹ️ About ConfessHub</h2>
            <div className="info-card">
              <p><strong>ConfessHub</strong> is a digital sanctuary where you can share your deepest thoughts, secrets, and stories without the fear of judgment.</p>
              <p>Our platform is designed for authenticity. Whether you want to rant about study stress, share a crush, or express a deep thought, ConfessHub provides the perfect anonymous outlet.</p>
              <p>Built with privacy-first technology, we ensure that your identity stays protected while your voice is heard by the community.</p>
              <p><em>"Speak your truth, shield your name."</em></p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  /* ----------------------------------------------------------------
     Loading splash
  ---------------------------------------------------------------- */
  if (!isLoaded) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#a78bfa' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* =================== LOGIN SCREEN =================== */}
      {!user && (
        <div className="login-screen">
          <div className="login-glow login-glow-1"></div>
          <div className="login-glow login-glow-2"></div>
          <div className="login-card">
            <div className="login-logo">
              <span className="logo-circle">🕊️</span>
            </div>
            <h1 className="login-title">ConfessHub</h1>
            <p className="login-tagline">Share your secrets, stay anonymous</p>

            <div className="login-methods">
              {!showManualForm ? (
                <>
                  {/* Official Google Sign-In button container */}
                  <div id="google-signin-button" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}></div>

                  <div className="login-divider">
                    <span>or use your account</span>
                  </div>

                  <button className="email-login-btn" onClick={() => setShowManualForm(true)}>
                    Continue with Email &amp; Username
                  </button>

                  <div className="signup-prompt">
                    <p>Don't have an account? <span className="signup-link" onClick={() => setShowManualForm(true)}>Sign Up</span></p>
                  </div>
                </>
              ) : (
                <form onSubmit={handleManualSubmit} className="manual-login-form">
                  <div className="form-field">
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="login-input"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <input
                      type="text"
                      placeholder="Username"
                      className="login-input"
                      value={manualUsername}
                      onChange={(e) => setManualUsername(e.target.value)}
                      required
                    />
                  </div>
                  {manualError && <p className="login-error-msg">{manualError}</p>}
                  <button type="submit" className="login-submit-btn" disabled={isAuthenticating}>
                    {isAuthenticating ? 'Connecting...' : 'Continue'}
                  </button>
                  <button type="button" className="login-back-btn" onClick={() => setShowManualForm(false)}>
                    Back to Google Sign-In
                  </button>
                </form>
              )}
            </div>

            <p className="login-footer-note">Email ID and Username are compulsory for secure access.</p>
          </div>
        </div>
      )}

      {/* =================== DASHBOARD =================== */}
      {user && (
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="sidebar-brand">
                <span className="sidebar-logo">🕊️</span>
                <div className="sidebar-brand-text">
                  <span className="sidebar-name">ConfessHub</span>
                  <span className="sidebar-tagline">ANONYMOUS</span>
                </div>
              </div>

              <nav className="sidebar-nav">
                <a href="#" className={`nav-link ${activeView === 'feed' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('feed'); }}>
                  <span className="nav-icon">🏠</span>
                  <span>Home</span>
                </a>
                <a href="#" className={`nav-link ${activeView === 'news' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('news'); }}>
                  <span className="nav-icon">📰</span>
                  <span>News Hub</span>
                </a>

                <div className="sidebar-divider"></div>
                <a href="#" className={`nav-link ${activeView === 'rules' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('rules'); }}>
                  <span className="nav-icon">📜</span>
                  <span>Hub Rules</span>
                </a>
                <a href="#" className={`nav-link ${activeView === 'privacy' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('privacy'); }}>
                  <span className="nav-icon">🔒</span>
                  <span>Privacy Policy</span>
                </a>
                <a href="#" className={`nav-link ${activeView === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('about'); }}>
                  <span className="nav-icon">ℹ️</span>
                  <span>About Hub</span>
                </a>
              </nav>
            </div>
            <div className="sidebar-bottom">
              <div className="sidebar-user">
                <button
                  className={`sidebar-avatar-btn ${activeView === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveView('profile')}
                  title="My Profile"
                >
                  <img
                    src={user.picture}
                    alt="avatar"
                    className="sidebar-avatar-img"
                  />
                </button>
                <div className="user-info">
                  <span className="user-name">{user.firstName || 'Anonymous'}</span>
                  <span className="user-status">● Online</span>
                </div>
                <button
                  onClick={signOut}
                  className="sidebar-logout-btn"
                  title="Logout"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </aside>

          <div className="main-area">
            {/* Top Bar */}
            <header className="topbar">
              <div className="topbar-left">
                <span className="welcome-dot">●</span>
                <span className="welcome-text">Welcome, <strong>{user.firstName || 'friend'}</strong></span>
              </div>

              <div className="topbar-center">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search secrets, topics, or #hashtags..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="topbar-right">
                <div className="notif-wrapper">
                  <button
                    className={`notif-btn ${notifications.length > 0 ? 'has-notif' : ''}`}
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    🔔
                    {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
                  </button>

                  {showNotifications && (
                    <div className="notif-dropdown">
                      <div className="notif-dropdown-header">
                        <h4>Recent Activity</h4>
                        <button className="close-notif" onClick={() => setShowNotifications(false)}>✕</button>
                      </div>
                      <div className="notif-list">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div key={n.id} className="notif-item">
                              <span className="notif-icon">{n.type === 'comment' ? '💬' : '✨'}</span>
                              <div className="notif-info">
                                <p className="notif-text">{n.text}</p>
                                <span className="notif-time">
                                  {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="notif-empty">No new notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="main-content">
              {renderContent()}
            </main>

            <footer className="app-footer">
              <div className="footer-content">
                <div className="footer-brand">
                  <span className="footer-logo">🕊️</span>
                  <span>ConfessHub</span>
                </div>
                <p className="footer-text">© 2026 ConfessHub. Speak your truth, stay anonymous.</p>
                <div className="footer-links">
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('about'); }}>About</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('privacy'); }}>Privacy</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('rules'); }}>Rules</a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;