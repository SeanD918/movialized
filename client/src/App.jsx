import { useState, useEffect, useRef } from 'react';
import {
  Film,
  Play,
  Calendar,
  Star,
  List,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  BarChart3,
  Check,
  User,
  Clock,
  TrendingUp,
  PlusCircle,
  FolderPlus,
  Bookmark,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  Menu
} from 'lucide-react';
import './App.css';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : '/api';

// Reusable stateful image component that renders a fallback on loading errors
function SafeImage({ src, alt, className, style, fallbackTitle, fallbackYear }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div 
        className={`${className} movie-poster-fallback`} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '1rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          ...style 
        }}
      >
        <Film className="fallback-icon" style={{ width: '28px', height: '28px', color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
        {fallbackTitle && (
          <span className="fallback-title" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
            {fallbackTitle}
          </span>
        )}
        {fallbackYear && (
          <span className="fallback-meta" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {fallbackYear}
          </span>
        )}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      style={style}
      onError={() => setHasError(true)}
    />
  );
}

// ── Scroll Zoom Hero Component ──
const ScrollZoomHero = ({ title, subtitle, image }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const mainEl = document.querySelector('.main-content');
    if (!mainEl) return;
    const handleScroll = () => setScrollY(mainEl.scrollTop);
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const progress = Math.min(scrollY / 400, 1);
  const scale = 1 + progress * 0.5;
  const blur = progress * 10;
  const opacity = 1 - progress * 0.8;

  return (
    <div style={{
      position: 'relative',
      height: '50vh',
      minHeight: '400px',
      width: '100%',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      marginBottom: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        position: 'absolute',
        inset: -20,
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
        opacity: opacity,
        transition: 'transform 0.1s ease-out, filter 0.1s ease-out, opacity 0.1s ease-out'
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(10,11,16,1) 0%, rgba(10,11,16,0.3) 50%, rgba(10,11,16,0.8) 100%)',
        zIndex: 1
      }} />
      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        padding: '2rem',
        transform: `translateY(${scrollY * 0.3}px)`,
        opacity: 1 - progress * 1.5
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          background: 'linear-gradient(to bottom right, #fff, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          letterSpacing: '-1px'
        }}>
          {title}
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

function App() {
  // Navigation Routing State
  const [activeTab, setActiveTab] = useState('discover');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Storage read blocked by browser tracking prevention:', e);
      return null;
    }
  });

  // Auth Form State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authBio, setAuthBio] = useState('');
  const [authError, setAuthError] = useState('');
  const [authRedirectAction, setAuthRedirectAction] = useState(null);

  // Data State
  const [movies, setMovies] = useState([]);
  const [diaryLogs, setDiaryLogs] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [stats, setStats] = useState({
    profile: { name: 'Movie Lover', bio: '', joinDate: 'June 2026' },
    summary: { totalWatched: 0, rewatches: 0, uniqueWatchedCount: 0, totalMinutes: 0, averageRating: 0 },
    charts: { genresData: [], ratingDistribution: [], timelineData: [], topDirectors: [] }
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sortKey, setSortKey] = useState('title');

  // Interactive States
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  // Logger Form State
  const [logMovie, setLogMovie] = useState(null);
  const [logId, setLogId] = useState(null); // set if editing
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logRating, setLogRating] = useState(4.0);
  const [logReview, setLogReview] = useState('');
  const [logRewatch, setLogRewatch] = useState(false);
  const [logRuntime, setLogRuntime] = useState(120);

  // List Management State
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  // Add Movie Form State (Admin Only)
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieDirector, setNewMovieDirector] = useState('');
  const [newMovieCast, setNewMovieCast] = useState('');
  const [newMovieYear, setNewMovieYear] = useState(new Date().getFullYear());
  const [newMovieRuntime, setNewMovieRuntime] = useState(120);
  const [newMovieGenres, setNewMovieGenres] = useState('');
  const [newMovieSynopsis, setNewMovieSynopsis] = useState('');
  const [newMoviePoster, setNewMoviePoster] = useState('');
  const [addMovieError, setAddMovieError] = useState('');
  const [addMovieSuccess, setAddMovieSuccess] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');

  // Admin Security States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('admin_auth') === 'true';
    } catch (e) {
      console.warn('Storage access blocked by browser tracking prevention:', e);
      return false;
    }
  });
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');

  // Gamification states
  const [watchGoal, setWatchGoal] = useState(() => {
    try {
      return parseInt(localStorage.getItem('watch_goal') || '1440');
    } catch (e) {
      console.warn('Storage access blocked by browser tracking prevention:', e);
      return 1440;
    }
  });

  // Loading States
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  // Sync watch goal to local storage
  useEffect(() => {
    try {
      localStorage.setItem('watch_goal', watchGoal.toString());
    } catch (e) {
      console.warn('Storage write blocked by browser tracking prevention:', e);
    }
  }, [watchGoal]);

  // Sync data and route hashes on mount/user change
  useEffect(() => {
    refreshData();

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin') {
        setActiveTab('admin');
      } else if (['dashboard', 'discover', 'diary', 'lists'].includes(hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab('discover'); // fallback
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial execution

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  // Scroll Reveal Observer — staggered entrance animations
  useEffect(() => {
    if (loading) return;

    const mainEl = document.querySelector('.main-content');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active-reveal');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: mainEl,              // scroll root is the main panel, not the viewport
      threshold: 0.06,
      rootMargin: '0px 0px -40px 0px'
    });

    // Assign stagger delays to sibling .reveal groups
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-pop');
    let siblingIndex = 0;
    let lastParent = null;
    elements.forEach(el => {
      if (el.parentElement !== lastParent) {
        siblingIndex = 0;
        lastParent = el.parentElement;
      }
      el.style.transitionDelay = `${siblingIndex * 80}ms`;
      siblingIndex++;
      observer.observe(el);
    });

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, [movies, diaryLogs, customLists, activeTab, loading]);

  // Navbar scroll shrink effect — listen on the main content scroll container
  useEffect(() => {
    const mainEl = document.querySelector('.main-content');
    if (!mainEl) return;
    const handleScroll = () => setNavScrolled(mainEl.scrollTop > 30);
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, [loading]);

  // Auth Submit Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
    const payload = isSignUp 
      ? { username: authUsername, password: authPassword, name: authName, bio: authBio }
      : { username: authUsername, password: authPassword };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        return;
      }
      setCurrentUser(data);
      try {
        localStorage.setItem('currentUser', JSON.stringify(data));
      } catch (err) {
        console.warn('Storage write blocked:', err);
      }
      setAuthUsername('');
      setAuthPassword('');
      setAuthName('');
      setAuthBio('');
      setIsAuthModalOpen(false);
      // Run any pending action that triggered the auth modal
      if (authRedirectAction) {
        setTimeout(() => authRedirectAction(data), 100);
        setAuthRedirectAction(null);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError('Connection error, is backend server running?');
    }
  };

  const handleLogoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('currentUser');
    } catch (err) {
      console.warn('Storage remove blocked:', err);
    }
    setActiveTab('dashboard');
    window.location.hash = 'dashboard';
    refreshData();
  };

  // Guard: require auth before any interactive action.
  // If guest, open auth modal and optionally queue the action to run after login.
  const requireAuth = (action) => {
    if (currentUser) {
      if (action) action(currentUser);
      return true;
    }
    setIsSignUp(false);
    setAuthError('');
    setAuthRedirectAction(action ? () => action : null);
    setIsAuthModalOpen(true);
    return false;
  };

  // Fetch all backend data
  const refreshData = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      const headers = {};
      if (currentUser && currentUser.id) {
        headers['X-User-Id'] = currentUser.id;
      }
      const [moviesRes, diaryRes, listsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/movies`, { headers }),
        fetch(`${API_BASE}/diary`, { headers }),
        fetch(`${API_BASE}/lists`, { headers }),
        fetch(`${API_BASE}/stats`, { headers })
      ]);

      if (!moviesRes.ok || !diaryRes.ok || !listsRes.ok || !statsRes.ok) {
        throw new Error('Server returned an error status');
      }

      setMovies(await moviesRes.json());
      setDiaryLogs(await diaryRes.json());
      setCustomLists(await listsRes.json());
      const statsData = await statsRes.json();
      setStats(statsData);
      setProfileName(statsData.profile?.name || 'Movie Lover');
      setProfileBio(statsData.profile?.bio || '');
    } catch (err) {
      console.error('Error refreshing backend data:', err);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  // Perform search & filters on backend
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFilteredMovies();
    }, 300); // Debounce search

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, genreFilter, yearFilter, sortKey, currentUser]);

  const fetchFilteredMovies = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (genreFilter) params.append('genre', genreFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (sortKey) params.append('sort', sortKey);

      const headers = {};
      if (currentUser && currentUser.id) {
        headers['X-User-Id'] = currentUser.id;
      }
      const res = await fetch(`${API_BASE}/movies?${params.toString()}`, { headers });
      if (res.ok) {
        setMovies(await res.json());
      }
    } catch (err) {
      console.error('Error filtering movies:', err);
    }
  };

  // Log / Edit Watch Session
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!logMovie) return;

    const payload = {
      movieId: logMovie.id,
      date: logDate,
      rating: logRating,
      review: logReview,
      rewatch: logRewatch,
      watchTime: parseInt(logRuntime)
    };

    try {
      let res;
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) headers['X-User-Id'] = currentUser.id;

      if (logId) {
        res = await fetch(`${API_BASE}/diary/${logId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/diary`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsLogModalOpen(false);
        setLogId(null);
        setLogReview('');
        setLogRewatch(false);
        refreshData();
        if (selectedMovie && selectedMovie.id === logMovie.id) {
          setTimeout(() => openMovieDetails(selectedMovie.id), 200);
        }
      }
    } catch (err) {
      console.error('Error saving log:', err);
    }
  };

  // Open Log Modal
  const startNewLog = (movie) => {
    setLogMovie(movie);
    setLogId(null);
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogRating(4.0);
    setLogReview('');
    setLogRewatch(false);
    setLogRuntime(movie.runtime || 120);
    setIsLogModalOpen(true);
  };

  const startEditLog = (log) => {
    const movie = movies.find(m => m.id === log.movieId) || log.movie;
    setLogMovie(movie);
    setLogId(log.id);
    setLogDate(log.date);
    setLogRating(log.rating);
    setLogReview(log.review);
    setLogRewatch(log.rewatch);
    setLogRuntime(log.watchTime || movie?.runtime || 120);
    setIsLogModalOpen(true);
  };

  // Delete Log Entry
  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this watch log?')) return;
    try {
      const headers = {};
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/diary/${id}`, { 
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        refreshData();
        if (selectedMovie) {
          setTimeout(() => openMovieDetails(selectedMovie.id), 200);
        }
      }
    } catch (err) {
      console.error('Error deleting watch log:', err);
    }
  };

  // Open Movie Details Drawer
  const openMovieDetails = async (movieId) => {
    try {
      const headers = {};
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/movies`, { headers });
      if (res.ok) {
        const allMovies = await res.json();
        const movie = allMovies.find(m => m.id === movieId);
        if (movie) {
          setSelectedMovie(movie);
          setIsDrawerOpen(true);
        }
      }
    } catch (err) {
      console.error('Error opening movie details:', err);
    }
  };

  // Add Movie to Watchlist
  const handleToggleWatchlist = async (movieId) => {
    const watchlist = customLists.find(l => l.id === 'watchlist' || l.id === `watchlist-${currentUser?.id}` || l.name.toLowerCase() === 'watchlist');
    if (!watchlist) return;

    const watchlistId = watchlist.id;
    const isListed = watchlist.movieIds.includes(movieId);
    try {
      let res;
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) headers['X-User-Id'] = currentUser.id;

      if (isListed) {
        res = await fetch(`${API_BASE}/lists/${watchlistId}/movies/${movieId}`, { 
          method: 'DELETE',
          headers
        });
      } else {
        res = await fetch(`${API_BASE}/lists/${watchlistId}/movies`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ movieId })
        });
      }

      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  // Custom Lists Management
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName) return;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/lists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newListName, description: newListDesc })
      });

      if (res.ok) {
        setNewListName('');
        setNewListDesc('');
        setIsListModalOpen(false);
        refreshData();
      }
    } catch (err) {
      console.error('Error creating custom list:', err);
    }
  };

  const handleAddMovieToList = async (listId, movieId) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/lists/${listId}/movies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ movieId })
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Error adding movie to list:', err);
    }
  };

  const handleRemoveMovieFromList = async (listId, movieId) => {
    try {
      const headers = {};
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/lists/${listId}/movies/${movieId}`, { 
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Error removing movie from list:', err);
    }
  };

  // Create Custom Movie (Admin Only)
  const handleCreateMovie = async (e) => {
    e.preventDefault();
    setAddMovieError('');
    setAddMovieSuccess(false);

    if (!newMovieTitle || !newMovieDirector || !newMovieYear || !newMovieRuntime) {
      setAddMovieError('Please fill in all required fields (Title, Director, Year, Runtime)');
      return;
    }

    const payload = {
      title: newMovieTitle,
      director: newMovieDirector,
      cast: newMovieCast,
      year: parseInt(newMovieYear),
      runtime: parseInt(newMovieRuntime),
      genres: newMovieGenres,
      synopsis: newMovieSynopsis,
      poster: newMoviePoster
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/movies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewMovieTitle('');
        setNewMovieDirector('');
        setNewMovieCast('');
        setNewMovieYear(new Date().getFullYear());
        setNewMovieRuntime(120);
        setNewMovieGenres('');
        setNewMovieSynopsis('');
        setNewMoviePoster('');
        setAddMovieSuccess(true);
        refreshData();
      } else {
        const errorData = await res.json();
        setAddMovieError(errorData.error || 'Failed to add movie');
      }
    } catch (err) {
      setAddMovieError('Server connection error. Please try again.');
      console.error('Error adding custom movie:', err);
    }
  };

  // Delete Movie (Admin Only)
  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Delete this movie from the platform? This will remove all associated logs and list entries.')) return;
    try {
      const headers = {};
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/movies/${id}`, { 
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setIsDrawerOpen(false);
        setSelectedMovie(null);
        refreshData();
      }
    } catch (err) {
      console.error('Error deleting movie:', err);
    }
  };

  // Update Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) headers['X-User-Id'] = currentUser.id;
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: profileName, bio: profileBio })
      });

      if (res.ok) {
        setIsEditingProfile(false);
        refreshData();
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  // Render Stars Helper
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="star-icon" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<Star key={i} className="star-icon half" />);
      } else {
        stars.push(<Star key={i} className="star-icon empty" />);
      }
    }
    return <div className="rating-stars">{stars}</div>;
  };

  // Enhanced watch time formatter: converts minutes to Years, Months, Days, and Hours
  const formatWatchTime = (totalMinutes) => {
    if (totalMinutes === 0) return '0 Hours';
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;
    const hours = totalHours % 24;

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
    if (hours > 0 || parts.length === 0) parts.push(`${hours} ${hours === 1 ? 'Hour' : 'Hours'}`);

    return parts.join(', ');
  };

  // Dynamic Badges Evaluation Logic
  const getBadges = () => {
    const totalMinutes = stats.summary.totalMinutes || 0;
    const totalWatched = stats.summary.totalWatched || 0;
    const uniqueCount = stats.summary.uniqueWatchedCount || 0;
    const reviewsCount = diaryLogs.filter(l => l.review && l.review.trim().length > 0).length;

    // Nolan movies watched count
    const nolanWatched = diaryLogs.filter(l => {
      const m = movies.find(mv => mv.id === l.movieId);
      return m && m.director === 'Christopher Nolan';
    }).length;

    // Max runtime watched
    const maxRuntime = diaryLogs.reduce((max, log) => {
      const m = movies.find(mv => mv.id === log.movieId) || log.movie;
      const run = log.watchTime || m?.runtime || 0;
      return run > max ? run : max;
    }, 0);

    const uniqueGenres = new Set();
    diaryLogs.forEach(log => {
      const m = movies.find(mv => mv.id === log.movieId) || log.movie;
      if (m && m.genres) m.genres.forEach(g => uniqueGenres.add(g));
    });

    return [
      {
        id: 'rookie',
        name: 'Cinephile Rookie',
        description: 'Log your first movie watch session.',
        icon: '🎬',
        unlocked: totalWatched >= 1,
        color: '#9061f9'
      },
      {
        id: 'marathon',
        name: 'Marathon Master',
        description: 'Watch a movie longer than 150 minutes.',
        icon: '🍿',
        unlocked: maxRuntime >= 150,
        color: '#ec4899'
      },
      {
        id: 'critic',
        name: 'Gold Critic',
        description: 'Log 3 or more movies with text reviews.',
        icon: '📝',
        unlocked: reviewsCount >= 3,
        color: '#fbbf24'
      },
      {
        id: 'nolan',
        name: 'Nolan Disciple',
        description: 'Log 3 movies directed by Christopher Nolan.',
        icon: '🦇',
        unlocked: nolanWatched >= 3,
        color: '#3b82f6'
      },
      {
        id: 'explorer',
        name: 'Genre Explorer',
        description: 'Watch films across 4 or more distinct genres.',
        icon: '🎭',
        unlocked: uniqueGenres.size >= 4,
        color: '#10b981'
      },
      {
        id: 'cadet',
        name: 'Chronos Cadet',
        description: 'Spend 24 hours (1,440 mins) watching films.',
        icon: '⏰',
        unlocked: totalMinutes >= 1440,
        color: '#f43f5e'
      },
      {
        id: 'collector',
        name: 'List Curator',
        description: 'Create at least 2 custom lists (excl. Watchlist).',
        icon: '📂',
        unlocked: customLists.filter(l => l.id !== 'watchlist').length >= 2,
        color: '#06b6d4'
      },
      {
        id: 'buff',
        name: 'Ultimate Film Buff',
        description: 'Spend 5 days (7,200 mins) watching films.',
        icon: '🏆',
        unlocked: totalMinutes >= 7200,
        color: '#eab308'
      }
    ];
  };

  // Render Sub-Views

  // 1. Dashboard View
  const renderDashboardView = () => {
    const { summary, charts } = stats;
    const { totalWatched, rewatches, uniqueWatchedCount, totalMinutes, averageRating } = summary;
    const { genresData = [], ratingDistribution = [], timelineData = [], topDirectors = [] } = charts;

    const maxRatingCount = Math.max(...ratingDistribution.map(d => d.count), 1);
    const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);

    // Goal Tracker computations
    const goalPercentage = Math.min((totalMinutes / watchGoal) * 100, 100);
    const goalReached = totalMinutes >= watchGoal;
    
    // SVG Circular Progress Ring math
    const progressRadius = 50;
    const progressCircumference = 2 * Math.PI * progressRadius;
    const strokeDashoffset = progressCircumference - (goalPercentage / 100) * progressCircumference;

    const badges = getBadges();

    return (
      <div className="tab-pane active fade-in">
        {/* ── Dashboard Profile Hero ── */}
        {isEditingProfile ? (
          <form className="glass-panel form-card fade-in" style={{ padding: '1.75rem', marginBottom: '2.5rem' }} onSubmit={handleSaveProfile}>
            <h3 style={{ marginBottom: '1.25rem', fontWeight: 700 }}>Edit User Profile</h3>
            <div className="form-group">
              <label className="form-label">Profile Name</label>
              <input
                type="text"
                className="input-field"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                style={{ padding: '0.65rem 1rem' }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Biography / Favorite Directors</label>
              <textarea
                className="input-field"
                value={profileBio}
                onChange={e => setProfileBio(e.target.value)}
                rows={3}
                style={{ padding: '0.65rem 1rem', resize: 'vertical' }}
                placeholder="Share your cinema love..."
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        ) : currentUser ? (
          /* ── Logged-in Profile Hero ── */
          <div
            className="glass-panel reveal"
            style={{
              padding: '2rem 2.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '3px solid transparent',
              backgroundImage: 'linear-gradient(rgba(18,19,26,0.75), rgba(18,19,26,0.75)), var(--accent-gradient)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              border: '1px solid',
              borderImageSource: 'var(--accent-gradient)',
              borderImageSlice: 1
            }}
          >
            {/* Glow orb behind avatar */}
            <div style={{
              position: 'absolute',
              left: '-30px',
              top: '-30px',
              width: '180px',
              height: '180px',
              background: 'radial-gradient(circle, rgba(144,97,249,0.18) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Large Avatar */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 0 0 4px rgba(144,97,249,0.2), 0 8px 30px rgba(144,97,249,0.35)',
              position: 'relative',
              zIndex: 1
            }}>
              {(stats.profile?.name || currentUser?.username || 'U')[0].toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(to right, #fff, #d1d5db)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stats.profile?.name || currentUser?.username}
                </h1>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  @{currentUser?.username}
                </span>
              </div>

              {stats.profile?.bio ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontStyle: 'italic', maxWidth: '480px' }}>
                  "{stats.profile.bio}"
                </p>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  No bio yet — add one to personalize your profile.
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Calendar size={13} style={{ color: 'var(--accent-purple)' }} />
                  Member since {stats.profile?.joinDate || 'June 2026'}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  background: 'rgba(144,97,249,0.12)',
                  border: '1px solid rgba(144,97,249,0.2)',
                  color: 'var(--accent-purple)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600
                }}>
                  🎬 Cinephile
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              className="btn btn-secondary"
              style={{ flexShrink: 0, alignSelf: 'flex-start' }}
              onClick={() => setIsEditingProfile(true)}
            >
              <User size={15} /> Edit Profile
            </button>
          </div>
        ) : (
          /* ── Guest Banner ── */
          <div
            className="glass-panel reveal"
            style={{
              padding: '1.75rem 2.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              borderLeft: '3px solid rgba(144,97,249,0.4)'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(144,97,249,0.1)',
              border: '2px dashed rgba(144,97,249,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={26} style={{ color: 'var(--accent-purple)', opacity: 0.7 }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Cinema Dashboard</h1>
              <p className="page-subtitle" style={{ marginTop: '0.2rem' }}>
                Browse movies freely. Sign in to track watches, earn badges, and build personal lists.
              </p>
            </div>
            <button
              className="btn btn-primary"
              style={{ flexShrink: 0 }}
              onClick={() => { setIsSignUp(false); setAuthError(''); setIsAuthModalOpen(true); }}
            >
              <User size={15} /> Sign In
            </button>
          </div>
        )}



        {/* Dynamic Goal Tracker and Metrics Grid */}
        <div className="dashboard-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
          
          {/* Main Counters Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 0 }}>
              <div className="glass-panel stat-card reveal">
                <span className="stat-label">Total Logs</span>
                <span className="stat-value highlight">{totalWatched}</span>
                <span className="stat-desc">Includes {rewatches} rewatches</span>
              </div>
              <div className="glass-panel stat-card reveal">
                <span className="stat-label">Unique Movies</span>
                <span className="stat-value">{uniqueWatchedCount}</span>
                <span className="stat-desc">Distinct film titles logged</span>
              </div>
            </div>

            <div className="glass-panel stat-card reveal" style={{ flex: 1, justifyContent: 'center' }}>
              <span className="stat-label">Time Spent Watching</span>
              <span className="stat-value highlight" style={{ fontSize: '1.5rem', lineHeight: '2.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'normal' }}>
                {formatWatchTime(totalMinutes)}
              </span>
              <span className="stat-desc">Total watch duration calculated in Years, Months, and Days</span>
            </div>
          </div>

          {/* Milestone Goal SVG progress Card */}
          <div className="glass-panel reveal" style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label" style={{ margin: 0 }}>Milestone Goal</span>
              
              <select 
                className="select-field" 
                style={{ padding: '0.35rem 1.75rem 0.35rem 0.6rem', fontSize: '0.8rem', minWidth: '120px' }}
                value={watchGoal}
                onChange={e => setWatchGoal(parseInt(e.target.value))}
              >
                <option value={600}>10 Hours</option>
                <option value={1440}>24 Hours (1 Day)</option>
                <option value={7200}>5 Days</option>
                <option value={14400}>10 Days</option>
                <option value={43200}>30 Days</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', margin: '1rem 0' }}>
              <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="goalRingGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#9061f9" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  
                  {/* Background Track Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r={progressRadius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="8"
                  />

                  {/* Active Glowing Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r={progressRadius}
                    fill="none"
                    stroke="url(#goalRingGrad)"
                    strokeWidth="8"
                    strokeDasharray={progressCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ 
                      transition: 'stroke-dashoffset 0.8s ease',
                      filter: 'drop-shadow(0px 0px 4px rgba(144, 97, 249, 0.4))'
                    }}
                  />
                </svg>

                {/* Percentage Center Text Overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{Math.round(goalPercentage)}%</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progress</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Current target watch goal is <strong style={{ color: 'white' }}>{formatWatchTime(watchGoal)}</strong>.
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {goalReached ? (
                    <span style={{ color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> Target Reached! 🏆
                    </span>
                  ) : (
                    <span>{formatWatchTime(Math.max(watchGoal - totalMinutes, 0))} remaining</span>
                  )}
                </div>
              </div>
            </div>

            {goalReached && (
              <div 
                className="fade-in"
                style={{ 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.15)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '0.4rem 0.75rem', 
                  fontSize: '0.75rem', 
                  color: '#34d399', 
                  textAlign: 'center',
                  fontWeight: 600,
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)'
                }}
              >
                Congratulations! You achieved this time milestone!
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          {/* Custom SVG Ratings Distribution Chart */}
          <div className="glass-panel chart-card reveal">
            <h3 className="chart-title">
              <BarChart3 size={18} /> Ratings Distribution
            </h3>
            <div className="chart-container">
              {ratingDistribution.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No logs with ratings yet</div>
              ) : (
                <svg className="bar-chart-svg" viewBox="0 0 400 200">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-purple)" />
                      <stop offset="100%" stopColor="var(--accent-pink)" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="chartGradHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                  
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                    <line 
                      key={i} 
                      x1="30" 
                      y1={30 + ratio * 130} 
                      x2="380" 
                      y2={30 + ratio * 130} 
                      className="chart-grid-line" 
                    />
                  ))}

                  {ratingDistribution.map((bin, index) => {
                    const width = 24;
                    const spacing = 35;
                    const startX = 40 + index * spacing;
                    const barHeight = (bin.count / maxRatingCount) * 120;
                    const yPos = 160 - barHeight;

                    return (
                      <g key={bin.stars}>
                        <rect
                          x={startX}
                          y={yPos}
                          width={width}
                          height={barHeight}
                          rx="4"
                          className="chart-bar"
                        />
                        {bin.count > 0 && (
                          <text
                            x={startX + width / 2}
                            y={yPos - 6}
                            className="chart-value-label"
                          >
                            {bin.count}
                          </text>
                        )}
                        <text
                          x={startX + width / 2}
                          y="180"
                          className="chart-label"
                        >
                          {bin.stars}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="30" y1="160" x2="380" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                </svg>
              )}
            </div>
          </div>

          {/* Genre Tracker */}
          <div className="glass-panel chart-card reveal">
            <h3 className="chart-title">
              <TrendingUp size={18} /> Top Genres
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', height: '220px', justifyContent: 'center' }}>
              {genresData.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No genre statistics available yet</div>
              ) : (
                <div className="genre-chart-container">
                  {genresData.slice(0, 5).map(genre => {
                    const maxCount = Math.max(...genresData.map(g => g.value), 1);
                    const percent = (genre.value / maxCount) * 100;
                    return (
                      <div className="genre-bar-row" key={genre.name}>
                        <span className="genre-name">{genre.name}</span>
                        <div className="genre-bar-bg">
                          <div className="genre-bar-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="genre-bar-value">{genre.value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Watch History Timeline */}
        <div className="glass-panel chart-card reveal" style={{ marginBottom: '2.5rem' }}>
          <h3 className="chart-title">
            <Calendar size={18} /> Watch Activity Timeline
          </h3>
          <div className="chart-container" style={{ height: '200px' }}>
            {timelineData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No monthly watch logs available yet</div>
            ) : (
              <svg className="bar-chart-svg" viewBox="0 0 600 160">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[0, 0.5, 1].map((ratio, i) => (
                  <line 
                    key={i} 
                    x1="40" 
                    y1={20 + ratio * 100} 
                    x2="560" 
                    y2={20 + ratio * 100} 
                    className="chart-grid-line" 
                  />
                ))}

                {(() => {
                  const spacing = 520 / (timelineData.length - 1 || 1);
                  const points = timelineData.map((d, index) => {
                    const x = 40 + index * spacing;
                    const y = 120 - (d.count / maxTimelineCount) * 90;
                    return { x, y, label: d.month, count: d.count };
                  });

                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaPath = points.length > 0 
                    ? `${linePath} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z` 
                    : '';

                  return (
                    <g>
                      {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
                      {linePath && (
                        <path 
                          d={linePath} 
                          fill="none" 
                          stroke="var(--accent-purple)" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                          strokeLinejoin="round" 
                        />
                      )}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="5" 
                            fill="var(--bg-secondary)" 
                            stroke="var(--accent-pink)" 
                            strokeWidth="3" 
                          />
                          <text 
                            x={p.x} 
                            y={p.y - 12} 
                            className="chart-value-label"
                          >
                            {p.count}
                          </text>
                          <text 
                            x={p.x} 
                            y="140" 
                            className="chart-label"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
                <line x1="40" y1="120" x2="560" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              </svg>
            )}
          </div>
        </div>

        {/* User Achievements & Badges System Section */}
        <div className="glass-panel reveal" style={{ padding: '1.75rem 2rem', marginBottom: '2.5rem' }}>
          <h3 className="chart-title" style={{ marginBottom: '0.5rem' }}>
            <Award size={18} /> Achievements & Badges
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Gamify your movie tracking. Unlock milestones by logging more films and reviews!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {badges.map(badge => (
              <div 
                key={badge.id} 
                className="glass-panel fade-in"
                style={{ 
                  padding: '1.25rem',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  opacity: badge.unlocked ? 1 : 0.4,
                  border: badge.unlocked ? `1px solid ${badge.color}` : '1px solid var(--border-color)',
                  boxShadow: badge.unlocked ? `0 0 15px rgba(255, 255, 255, 0.02), inset 0 0 10px rgba(144, 97, 249, 0.05)` : 'none',
                  transition: 'all var(--transition-normal)'
                }}
              >
                <div 
                  style={{ 
                    fontSize: '2rem',
                    opacity: badge.unlocked ? 1 : 0.3,
                    filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                    width: '40px',
                    textAlign: 'center'
                  }}
                >
                  {badge.icon}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ fontWeight: 700, color: badge.unlocked ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                    {badge.name}
                    {badge.unlocked ? (
                      <span style={{ color: badge.color }} title="Unlocked!"><Unlock size={10} /></span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }} title="Locked"><Lock size={10} /></span>
                    )}
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1rem', marginTop: '0.25rem' }}>
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Favorite Directors */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 className="chart-title">
            <Film size={18} /> Favorite Directors
          </h3>
          {topDirectors.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Log more movies to identify your favorite directors.</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
              {topDirectors.map((dir, idx) => (
                <div key={dir.name} className="profile-card" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                  <div className="profile-avatar" style={{ width: '32px', height: '32px', fontSize: '0.9rem', boxShadow: 'none' }}>{idx + 1}</div>
                  <div>
                    <h5 style={{ fontWeight: 600 }}>{dir.name}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{dir.count} films watched</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. Discover Page View
  const renderDiscoverView = () => {
    const allGenres = Array.from(new Set(movies.flatMap(m => m.genres || []))).sort();
    const allYears = Array.from(new Set(movies.map(m => m.year))).sort((a, b) => b - a);

    return (
      <div className="tab-pane active fade-in">
        <ScrollZoomHero
          title="Discover Movies"
          subtitle="Search, sort, filter, and track movies database. Find your next favorite film."
          image="https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg" // High quality backdrop example
        />

        <div className="discover-controls">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, director, cast..."
              className="input-field"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="select-field"
            value={genreFilter}
            onChange={e => setGenreFilter(e.target.value)}
          >
            <option value="">All Genres</option>
            {allGenres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            className="select-field"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All Years</option>
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            className="select-field"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
          >
            <option value="title">Sort: Title A-Z</option>
            <option value="year-desc">Sort: Year (Newest)</option>
            <option value="year-asc">Sort: Year (Oldest)</option>
            <option value="runtime">Sort: Runtime</option>
          </select>
        </div>

        {movies.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Film size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No movies found</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Try resetting the filters or check custom list matches.</p>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map((movie, idx) => {
              const watchlist = customLists.find(l => l.id === 'watchlist' || l.id === `watchlist-${currentUser?.id}` || l.name.toLowerCase() === 'watchlist');
              const isOnWatchlist = watchlist?.movieIds.includes(movie.id);

              return (
                <div
                  key={movie.id}
                  className="movie-card reveal-pop"
                  style={{ transitionDelay: `${(idx % 10) * 60}ms` }}
                  onClick={() => openMovieDetails(movie.id)}
                >
                  <div className="movie-poster-wrapper">
                    <SafeImage 
                      src={movie.poster} 
                      alt={movie.title} 
                      className="movie-poster-img"
                      fallbackTitle={movie.title}
                      fallbackYear={movie.year}
                    />

                    <div className="movie-card-overlay" onClick={e => e.stopPropagation()}>
                      <button className="quick-log-btn" onClick={() => requireAuth(() => startNewLog(movie))}>
                        <Play size={12} fill="white" /> Log Watch
                      </button>
                      
                      <button 
                        className="quick-log-btn" 
                        style={{ 
                          background: isOnWatchlist ? 'rgba(144, 97, 249, 0.2)' : 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          marginTop: '0.35rem'
                        }} 
                        onClick={() => requireAuth(() => handleToggleWatchlist(movie.id))}
                      >
                        {isOnWatchlist ? (
                          <>
                            <Check size={12} /> Watchlist
                          </>
                        ) : (
                          <>
                            <Bookmark size={12} /> Watchlist
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <h4 className="movie-title">{movie.title}</h4>
                  <div className="movie-meta">
                    <span>{movie.year}</span>
                    <span>{movie.runtime} min</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 3. Diary Timeline View
  const renderDiaryView = () => {
    return (
      <div className="tab-pane active fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Watch Diary</h1>
            <p className="page-subtitle">Your chronological feed of watched movies and reviews</p>
          </div>
        </div>

        {diaryLogs.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Calendar size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>Your watch diary is empty</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>Start logging films you've watched from the discover grid.</p>
            <button className="btn btn-primary" onClick={() => window.location.hash = 'discover'}>Find Movies to Log</button>
          </div>
        ) : (
          <div className="diary-timeline">
            {diaryLogs.map(log => {
              const movie = movies.find(m => m.id === log.movieId) || log.movie;

              return (
                <div key={log.id} className="diary-item reveal">
                  <div className="timeline-dot"></div>
                  <div className="glass-panel diary-card">
                    <SafeImage
                      src={movie?.poster}
                      alt={movie?.title}
                      className="diary-poster"
                      style={{ width: '70px', height: '105px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      fallbackTitle={movie?.title}
                    />
                    
                    <div className="diary-content">
                      <div className="diary-top">
                        <div>
                          <h4 className="diary-movie-title" onClick={() => movie?.id && openMovieDetails(movie.id)}>
                            {movie?.title || 'Unknown Film'}{' '}
                            <span className="diary-movie-year">({movie?.year || '—'})</span>
                          </h4>
                          <span className="diary-date">{log.date}</span>
                        </div>
                        <div className="diary-actions">
                          <button className="action-icon-btn" title="Edit Log" onClick={() => startEditLog(log)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="action-icon-btn delete-btn" title="Delete Log" onClick={() => handleDeleteLog(log.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {log.rating > 0 && renderStars(log.rating)}

                      {log.review && (
                        <p className="diary-review">
                          "{log.review}"
                        </p>
                      )}

                      <div className="diary-meta-row">
                        {log.rewatch && (
                          <span className="meta-pill rewatch-pill">
                            <Plus size={10} /> Rewatch
                          </span>
                        )}
                        <span className="meta-pill">
                          <Clock /> {log.watchTime || movie?.runtime || 120} min
                        </span>
                        {movie?.genres && movie.genres.slice(0, 2).map(g => (
                          <span key={g} className="meta-pill">{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 4. Custom Lists View
  const renderListsView = () => {
    return (
      <div className="tab-pane active fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Movie Lists</h1>
            <p className="page-subtitle">Organize and curate lists of your favorite films</p>
          </div>
          <button className="btn btn-primary" onClick={() => requireAuth(() => setIsListModalOpen(true))}>
            <FolderPlus size={16} /> Create Custom List
          </button>
        </div>

        <div className="lists-grid">
          {customLists.map(list => {
            const hasMovies = list.movies && list.movies.length > 0;
            return (
              <div key={list.id} className="glass-panel list-card reveal">
                <h3 className="list-name">{list.name}</h3>
                <p className="list-desc">{list.description || 'No description provided.'}</p>
                
                <div className="list-posters-preview">
                  {hasMovies ? (
                    list.movies.slice(0, 5).map((m, idx) => (
                      <SafeImage
                        key={m.id || idx}
                        src={m.poster}
                        alt={m.title}
                        className="preview-poster-img"
                        style={{ zIndex: 10 - idx }}
                        fallbackTitle={m.title}
                      />
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Empty List</span>
                  )}
                </div>

                <div className="list-meta">
                  <span>Created {list.created || 'recently'}</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{list.movieIds.length} films</span>
                </div>
              </div>
            );
          })}
        </div>

        {customLists.length > 0 && (
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={20} color="var(--accent-purple)" /> List Manager
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {customLists.map(list => (
                <div key={list.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontWeight: 700 }}>{list.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{list.movieIds.length} movies</span>
                  </div>
                  {list.movies && list.movies.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {list.movies.map(m => (
                        <div 
                          key={m.id} 
                          className="profile-card" 
                          style={{ margin: 0, padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', gap: '0.5rem', width: '220px' }}
                        >
                          <SafeImage src={m.poster} alt={m.title} style={{ width: '30px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} fallbackTitle={m.title} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.year}</span>
                          </div>
                          <button 
                            className="action-icon-btn delete-btn" 
                            title="Remove from List"
                            onClick={() => handleRemoveMovieFromList(list.id, m.id)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No movies in this list yet. Go to Discover and click a movie to add it!</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5. Admin Dashboard View
  const renderAdminView = () => {
    if (!isAdminAuthenticated) {
      const handleLogin = (e) => {
        e.preventDefault();
        if (adminPasscode === 'admin123') {
          setIsAdminAuthenticated(true);
          try {
            sessionStorage.setItem('admin_auth', 'true');
          } catch (e) {
            console.warn('Storage write blocked by browser tracking prevention:', e);
          }
          setAdminError('');
          setAdminPasscode('');
        } else {
          setAdminError('Invalid admin passcode. Access Denied.');
        }
      };

      return (
        <div className="tab-pane active fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div className="logo-icon" style={{ width: '48px', height: '48px' }}>
                <Film size={24} fill="white" />
              </div>
            </div>
            <h2 style={{ textAlign: 'center', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Admin Login Required</h2>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2.25rem' }}>
              Authentication is required to edit the database.
            </p>

            <form onSubmit={handleLogin}>
              {adminError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', textAlign: 'center' }}>
                  {adminError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Passcode</label>
                <input
                  type="password"
                  className="input-field"
                  style={{ padding: '0.75rem 1rem' }}
                  value={adminPasscode}
                  onChange={e => setAdminPasscode(e.target.value)}
                  placeholder="Enter admin passcode..."
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                Verify & Unlock
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem' }}
                onClick={() => window.location.hash = 'dashboard'}
              >
                Return to Dashboard
              </button>
            </form>
          </div>
        </div>
      );
    }

    const handleLogout = () => {
      setIsAdminAuthenticated(false);
      try {
        sessionStorage.removeItem('admin_auth');
      } catch (e) {
        console.warn('Storage remove blocked by browser tracking prevention:', e);
      }
      window.location.hash = 'dashboard';
    };

    return (
      <div className="tab-pane active fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Console</h1>
            <p className="page-subtitle">Manage catalog items, insert and delete films</p>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Exit Console
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
          {/* Add Film Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} color="var(--accent-purple)" /> Add New Movie
            </h3>
            <form onSubmit={handleCreateMovie}>
              {addMovieError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  {addMovieError}
                </div>
              )}
              {addMovieSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  Movie successfully added to catalog!
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Movie Title *</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '0.65rem 1rem' }}
                  value={newMovieTitle}
                  onChange={e => setNewMovieTitle(e.target.value)}
                  placeholder="e.g. Inception"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Director Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: '0.65rem 1rem' }}
                    value={newMovieDirector}
                    onChange={e => setNewMovieDirector(e.target.value)}
                    placeholder="e.g. Christopher Nolan"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Release Year *</label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '0.65rem 1rem' }}
                    value={newMovieYear}
                    onChange={e => setNewMovieYear(e.target.value)}
                    min={1880}
                    max={new Date().getFullYear() + 5}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Runtime (minutes) *</label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '0.65rem 1rem' }}
                    value={newMovieRuntime}
                    onChange={e => setNewMovieRuntime(e.target.value)}
                    min={1}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Genres (comma separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: '0.65rem 1rem' }}
                    value={newMovieGenres}
                    onChange={e => setNewMovieGenres(e.target.value)}
                    placeholder="e.g. Sci-Fi, Action, Thriller"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cast Members (comma separated)</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '0.65rem 1rem' }}
                  value={newMovieCast}
                  onChange={e => setNewMovieCast(e.target.value)}
                  placeholder="e.g. Leonardo DiCaprio, Joseph Gordon-Levitt"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Poster Image URL (Optional)</label>
                <input
                  type="url"
                  className="input-field"
                  style={{ padding: '0.65rem 1rem' }}
                  value={newMoviePoster}
                  onChange={e => setNewMoviePoster(e.target.value)}
                  placeholder="e.g. https://image.tmdb.org/t/p/w500/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Synopsis (Short summary)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  style={{ padding: '0.65rem 1rem', resize: 'vertical' }}
                  value={newMovieSynopsis}
                  onChange={e => setNewMovieSynopsis(e.target.value)}
                  placeholder="Brief movie plot outline..."
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                <Plus size={16} /> Save Movie to Platform
              </button>
            </form>
          </div>

          {/* Database Catalog List */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: '820px' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={20} color="var(--accent-pink)" /> Catalog Database ({movies.length} Movies)
            </h3>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {movies.map(movie => (
                <div 
                  key={movie.id} 
                  className="profile-card" 
                  style={{ margin: 0, padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.01)', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.02)' }}
                >
                  <SafeImage 
                    src={movie.poster} 
                    alt={movie.title} 
                    style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '4px' }} 
                    fallbackTitle={movie.title}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{movie.year} • Dir: {movie.director}</span>
                  </div>
                  <button 
                    className="action-icon-btn delete-btn" 
                    title="Delete from Database"
                    onClick={() => handleDeleteMovie(movie.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className={`topnav ${navScrolled ? 'scrolled' : ''}`}>
        {/* Logo */}
        <div className="logo-container" onClick={() => window.location.hash = 'dashboard'} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <Film size={18} fill="white" />
          </div>
          <span className="logo-text">movialized</span>
        </div>

        {/* Hamburger Menu Button (Mobile Only) */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Center Nav Links */}
        <nav className={`topnav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { window.location.hash = 'dashboard'; setIsMobileMenuOpen(false); }}
          >
            <BarChart3 size={16} /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => { window.location.hash = 'discover'; setIsMobileMenuOpen(false); }}
          >
            <Film size={16} /> Discover
          </button>
          <button
            className={`nav-item ${activeTab === 'diary' ? 'active' : ''}`}
            onClick={() => { window.location.hash = 'diary'; setIsMobileMenuOpen(false); }}
          >
            <Calendar size={16} /> Diary Log
          </button>
          <button
            className={`nav-item ${activeTab === 'lists' ? 'active' : ''}`}
            onClick={() => { window.location.hash = 'lists'; setIsMobileMenuOpen(false); }}
          >
            <List size={16} /> My Lists
          </button>
        </nav>

        {/* Right Side: Profile / Auth */}
        <div className="topnav-right">
          {currentUser ? (
            <div className="topnav-profile">
              <div className="profile-avatar" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
                {(stats.profile?.name || currentUser?.username || 'U')[0].toUpperCase()}
              </div>
              <span className="topnav-username">{stats.profile?.name || currentUser?.username}</span>
              <button
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--danger)'
                }}
                onClick={handleLogoutUser}
              >
                <Lock size={13} /> Log Out
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}
              onClick={() => { setIsSignUp(false); setAuthError(''); setIsAuthModalOpen(true); }}
            >
              <User size={14} /> Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="main-content">
        {connectionError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <h3 style={{ color: 'var(--text-primary)' }}>Cannot Connect to Database Server</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.95rem', lineHeight: '1.6rem' }}>
              The application was unable to fetch data from the backend database server. Please make sure the server is running on <strong>http://localhost:3000</strong>.
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.05)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              cd server && npm start
            </div>
            <button className="btn btn-primary" onClick={refreshData} style={{ marginTop: '0.5rem' }}>
              Retry Connection
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
            <Film size={36} className="spinning" style={{ animation: 'spin 2s linear infinite' }} />
            <h4>Loading Movialized Database...</h4>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboardView()}
            {activeTab === 'discover' && renderDiscoverView()}
            {activeTab === 'diary' && renderDiaryView()}
            {activeTab === 'lists' && renderListsView()}
            {activeTab === 'admin' && renderAdminView()}
          </>
        )}
      </main>

      {/* Movie Detail Side Drawer Overlay */}
      <div 
        className={`drawer-backdrop ${isDrawerOpen && selectedMovie ? 'active' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      >
        {selectedMovie && (
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div 
              className="drawer-banner" 
              style={{ backgroundImage: selectedMovie.poster ? `url(${selectedMovie.poster})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
            >
              <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="drawer-body">
              <div className="drawer-head-row">
                <SafeImage 
                  src={selectedMovie.poster} 
                  alt={selectedMovie.title} 
                  className="drawer-poster" 
                  style={{ width: '120px', height: '180px', objectFit: 'cover' }}
                  fallbackTitle={selectedMovie.title}
                />
                <div className="drawer-titles">
                  <h2 className="drawer-movie-title">{selectedMovie.title}</h2>
                  <div className="drawer-movie-meta">
                    <span>{selectedMovie.year}</span>
                    <span>{selectedMovie.runtime} min</span>
                    <span>Dir: {selectedMovie.director}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {selectedMovie.genres && selectedMovie.genres.map(g => (
                      <span key={g} className="genre-tag">{g}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="drawer-actions-row">
                <button className="btn btn-primary" onClick={() => { setIsDrawerOpen(false); startNewLog(selectedMovie); }}>
                  <Play size={14} fill="white" /> Log Watch Session
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleToggleWatchlist(selectedMovie.id)}
                >
                  {customLists.find(l => l.id === 'watchlist')?.movieIds.includes(selectedMovie.id) ? (
                    <>
                      <Check size={14} color="var(--success)" /> In Watchlist
                    </>
                  ) : (
                    <>
                      <Bookmark size={14} /> Add to Watchlist
                    </>
                  )}
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Add movie to list...</label>
                <select 
                  className="select-field" 
                  style={{ width: '100%', padding: '0.5rem 2rem 0.5rem 1rem' }}
                  onChange={(e) => {
                    const listId = e.target.value;
                    if (listId) {
                      handleAddMovieToList(listId, selectedMovie.id);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Choose custom list—</option>
                  {customLists.filter(l => l.id !== 'watchlist').map(list => (
                    <option 
                      key={list.id} 
                      value={list.id}
                      disabled={list.movieIds.includes(selectedMovie.id)}
                    >
                      {list.name} {list.movieIds.includes(selectedMovie.id) ? '(Already in list)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Synopsis</h4>
                <p className="drawer-synopsis">{selectedMovie.synopsis || 'No synopsis available for this movie.'}</p>
              </div>

              {selectedMovie.cast && selectedMovie.cast.length > 0 && (
                <div className="drawer-section">
                  <h4 className="drawer-section-title">Principal Cast</h4>
                  <div className="drawer-cast-list">
                    {selectedMovie.cast.map(c => (
                      <span key={c} className="cast-member">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="drawer-section">
                <h4 className="drawer-section-title">Your Watch History</h4>
                {diaryLogs.filter(log => log.movieId === selectedMovie.id).length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You haven't logged this film yet.</span>
                ) : (
                  <div className="drawer-log-list">
                    {diaryLogs
                      .filter(log => log.movieId === selectedMovie.id)
                      .map(log => (
                        <div key={log.id} className="drawer-log-item">
                          <div className="drawer-log-header">
                            <span className="drawer-log-date">{log.date}</span>
                            {log.rewatch && <span className="meta-pill rewatch-pill" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>Rewatch</span>}
                          </div>
                          {log.rating > 0 && renderStars(log.rating)}
                          {log.review && <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>"{log.review}"</p>}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Danger Zone - delete movie */}
              {isAdminAuthenticated && (
                <div className="drawer-section" style={{ borderTop: '1px solid rgba(239, 68, 68, 0.15)', paddingTop: '1.5rem', marginTop: '3rem' }}>
                  <h4 className="drawer-section-title" style={{ border: 'none', color: 'var(--danger)', marginBottom: '0.75rem' }}>Danger Zone</h4>
                  <button 
                    className="btn btn-danger" 
                    style={{ width: '100%' }}
                    onClick={() => handleDeleteMovie(selectedMovie.id)}
                  >
                    <Trash2 size={14} /> Remove Movie from Platform
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Watch Logger Dialog */}
      <div className={`modal-backdrop ${isLogModalOpen && logMovie ? 'active' : ''}`}>
        {logMovie && (
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{logId ? 'Edit Watch Log' : 'Log Movie Watch'}</h3>
              <button className="modal-close" onClick={() => setIsLogModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveLog}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <SafeImage 
                    src={logMovie.poster} 
                    alt={logMovie.title} 
                    style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} 
                    fallbackTitle={logMovie.title}
                  />
                  <div>
                    <h4 style={{ fontWeight: 700 }}>{logMovie.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{logMovie.year} • {logMovie.director}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date Watched</label>
                  <input
                    type="date"
                    className="input-field"
                    style={{ padding: '0.65rem 1rem' }}
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Your Rating ({logRating.toFixed(1)} Stars)</label>
                  <div className="rating-input-container">
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.5"
                      value={logRating}
                      onChange={e => setLogRating(parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--star-color)', cursor: 'pointer' }}
                    />
                    {renderStars(logRating)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="form-group">
                  <div className="checkbox-group" onClick={() => setLogRewatch(!logRewatch)}>
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={logRewatch}
                      onChange={() => {}}
                    />
                    <span className="checkbox-label">Rewatched film?</span>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}>Watch Duration (min)</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: '0.4rem 0.75rem' }}
                      value={logRuntime}
                      onChange={e => setLogRuntime(e.target.value)}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Review / Notes</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    style={{ padding: '0.65rem 1rem', resize: 'vertical' }}
                    value={logReview}
                    onChange={e => setLogReview(e.target.value)}
                    placeholder="Write your thoughts about this movie..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {logId ? 'Save Changes' : 'Log Watch Session'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Create Custom List Modal */}
      <div className={`modal-backdrop ${isListModalOpen ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Create Custom Movie List</h3>
            <button className="modal-close" onClick={() => setIsListModalOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleCreateList}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">List Name *</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '0.65rem 1rem' }}
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="e.g. Favorite Sci-Fi"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">List Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  style={{ padding: '0.65rem 1rem', resize: 'vertical' }}
                  value={newListDesc}
                  onChange={e => setNewListDesc(e.target.value)}
                  placeholder="What is this list about?"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsListModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create List</button>
            </div>
          </form>
        </div>
      </div>
      {/* ====== Auth Modal Overlay ====== */}
      {isAuthModalOpen && (
        <div 
          className="modal-backdrop active"
          onClick={(e) => { if (e.target === e.currentTarget) setIsAuthModalOpen(false); }}
        >
          <div 
            className="glass-panel modal-content"
            style={{ 
              width: '100%', 
              maxWidth: '440px', 
              padding: '2.5rem', 
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(144, 97, 249, 0.15)'
            }}
          >
            {/* Close button */}
            <button 
              className="modal-close"
              style={{ position: 'absolute', top: '1rem', right: '1rem' }}
              onClick={() => setIsAuthModalOpen(false)}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div className="logo-icon" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                <Film size={22} fill="white" />
              </div>
            </div>
            
            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.65rem', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
              {isSignUp ? 'Create your profile' : 'Sign in to interact'}
            </h2>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
              {isSignUp
                ? 'Track watch logs, rate films, and build custom lists.'
                : 'You need an account to log watches, rate movies, and manage lists.'}
            </p>

            <div 
              style={{ 
                display: 'flex', 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '4px', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <button 
                className={`btn ${!isSignUp ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1, padding: '0.5rem', border: 'none', background: !isSignUp ? 'var(--accent-gradient)' : 'transparent', color: 'white', fontWeight: 600 }}
                onClick={() => { setIsSignUp(false); setAuthError(''); }}
              >
                Sign In
              </button>
              <button 
                className={`btn ${isSignUp ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1, padding: '0.5rem', border: 'none', background: isSignUp ? 'var(--accent-gradient)' : 'transparent', color: 'white', fontWeight: 600 }}
                onClick={() => { setIsSignUp(true); setAuthError(''); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authError && (
                <div 
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    color: 'var(--danger)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--radius-md)', 
                    marginBottom: '1.25rem', 
                    fontSize: '0.85rem', 
                    textAlign: 'center' 
                  }}
                >
                  {authError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '0.75rem 1rem' }}
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value)}
                  placeholder="e.g. moviefanatic"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="input-field"
                  style={{ padding: '0.75rem 1rem' }}
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {isSignUp && (
                <>
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: '0.75rem 1rem' }}
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio (Optional)</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      style={{ padding: '0.65rem 1rem', resize: 'vertical' }}
                      value={authBio}
                      onChange={e => setAuthBio(e.target.value)}
                      placeholder="Avid film lover. Track ratings and write reviews..."
                    />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  marginTop: '0.75rem', 
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
                }}
              >
                {isSignUp ? 'Create Profile & Login' : 'Verify & Enter'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Just browsing? <button 
                style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                onClick={() => setIsAuthModalOpen(false)}
              >Continue as guest</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
