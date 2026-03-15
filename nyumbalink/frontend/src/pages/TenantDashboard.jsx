import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './TenantDashboard.module.css';

const AREAS = ['Rongai','Kasarani','Kilimani','Westlands','Embakasi','Ngong Road','Lavington','Langata','Ruaka','Ruiru','Thika Road','South B','South C'];

function StarDisplay({ rating }) {
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= rating ? styles.starOn : styles.starOff}>★</span>
      ))}
    </div>
  );
}

function ListingMiniCard({ listing, onUnbookmark }) {
  const navigate = useNavigate();
  const primary = listing.photos?.find(p => p.is_primary) || listing.photos?.[0];
  return (
    <div className={styles.miniCard}>
      <div className={styles.miniCardImg} onClick={() => navigate(`/listings/${listing.id}`)}>
        {primary
          ? <img src={primary.image} alt={listing.title} />
          : <div className={styles.noImg}>📷</div>
        }
        {listing.status === 'verified' && <span className={styles.liveBadge}>✓ Live</span>}
      </div>
      <div className={styles.miniCardBody}>
        <div className={styles.miniCardArea}>📍 {listing.area_name}</div>
        <h4 onClick={() => navigate(`/listings/${listing.id}`)}>{listing.title}</h4>
        <div className={styles.miniCardPrice}>
          KES {listing.rent_kes?.toLocaleString()}<span>/mo</span>
        </div>
        <div className={styles.miniCardMeta}>
          <span>{listing.bedrooms === 0 ? 'Bedsitter' : `${listing.bedrooms} bed`}</span>
          {listing.is_furnished && <span>Furnished</span>}
          {listing.avg_rating && <span>★ {listing.avg_rating}</span>}
        </div>
      </div>
      {onUnbookmark && (
        <button className={styles.unbookmarkBtn} onClick={() => onUnbookmark(listing.id)} title="Remove bookmark">♥</button>
      )}
    </div>
  );
}

export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState('saved');
  const [bookmarks, setBookmarks]       = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [myReviews, setMyReviews]       = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Profile form
  const [profileForm, setProfileForm]   = useState({ username: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]     = useState('');

  // Password form
  const [pwForm, setPwForm]             = useState({ current: '', new1: '', new2: '' });
  const [pwMsg, setPwMsg]               = useState('');
  const [pwSaving, setPwSaving]         = useState(false);

  // Search prefs
  const [prefs, setPrefs]               = useState({
    area: '', max_rent: '', bedrooms: '', is_furnished: ''
  });
  const [prefsSaved, setPrefsSaved]     = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'tenant') { navigate('/'); return; }
    setProfileForm({ username: user.username || '', phone: user.phone || '' });
    const savedPrefs = JSON.parse(localStorage.getItem('hausio_prefs') || '{}');
    if (savedPrefs) setPrefs(p => ({ ...p, ...savedPrefs }));
    fetchBookmarks();
    fetchRecentlyViewed();
    fetchMyReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchBookmarks = async () => {
    setLoadingSaved(true);
    try {
      const res = await api.get('/listings/bookmarks/');
      setBookmarks(res.data);
    } catch {}
    finally { setLoadingSaved(false); }
  };

  const fetchRecentlyViewed = async () => {
    setLoadingRecent(true);
    try {
      const ids = JSON.parse(localStorage.getItem('hausio_recent') || '[]');
      if (ids.length === 0) { setLoadingRecent(false); return; }
      const results = await Promise.allSettled(
        ids.map(id => api.get(`/listings/${id}/`))
      );
      const listings = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data);
      setRecentListings(listings);
    } catch {}
    finally { setLoadingRecent(false); }
  };

  const fetchMyReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await api.get('/accounts/my-reviews/');
      setMyReviews(res.data);
    } catch {}
    finally { setLoadingReviews(false); }
  };

  const handleUnbookmark = async (listingId) => {
    try {
      await api.post(`/listings/${listingId}/bookmark/`);
      setBookmarks(prev => prev.filter(b => b.listing !== listingId));
    } catch {}
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await api.patch('/accounts/profile/', profileForm);
      setProfileMsg('✓ Profile updated successfully');
    } catch {
      setProfileMsg('✗ Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new1 !== pwForm.new2) return setPwMsg('✗ New passwords do not match');
    if (pwForm.new1.length < 8) return setPwMsg('✗ Password must be at least 8 characters');
    setPwSaving(true);
    setPwMsg('');
    try {
      await api.post('/accounts/change-password/', {
        current_password: pwForm.current,
        new_password: pwForm.new1,
      });
      setPwMsg('✓ Password changed successfully');
      setPwForm({ current: '', new1: '', new2: '' });
    } catch {
      setPwMsg('✗ Current password is incorrect');
    } finally {
      setPwSaving(false);
    }
  };

  const handleSavePrefs = () => {
    localStorage.setItem('hausio_prefs', JSON.stringify(prefs));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const handleBrowseWithPrefs = () => {
    localStorage.setItem('hausio_prefs', JSON.stringify(prefs));
    navigate('/browse');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const TABS = [
    { key: 'saved',   label: '♥ Saved',          count: bookmarks.length },
    { key: 'recent',  label: '🕐 Recently Viewed', count: recentListings.length },
    { key: 'reviews', label: '★ My Reviews',       count: myReviews.length },
    { key: 'prefs',   label: '🔔 Search Prefs',    count: null },
    { key: 'profile', label: '👤 Profile',         count: null },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1>Hey, {user?.username || user?.email?.split('@')[0]} 👋</h1>
              <p>{user?.email}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.browseBtn} onClick={() => navigate('/browse')}>
              🏠 Browse Listings
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        {/* ── Quick stats ── */}
        <div className={styles.statsRow}>
          <div className={styles.statCard} onClick={() => setActiveTab('saved')} style={{ cursor: 'pointer' }}>
            <span className={styles.statNum}>{bookmarks.length}</span>
            <span className={styles.statLabel}>Saved Listings</span>
          </div>
          <div className={styles.statCard} onClick={() => setActiveTab('recent')} style={{ cursor: 'pointer' }}>
            <span className={styles.statNum}>{recentListings.length}</span>
            <span className={styles.statLabel}>Recently Viewed</span>
          </div>
          <div className={styles.statCard} onClick={() => setActiveTab('reviews')} style={{ cursor: 'pointer' }}>
            <span className={styles.statNum}>{myReviews.length}</span>
            <span className={styles.statLabel}>Reviews Left</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={activeTab === t.key ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={styles.tabCount}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}

        {/* SAVED */}
        {activeTab === 'saved' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Saved Listings</h2>
              <p>Properties you've bookmarked for later</p>
            </div>
            {loadingSaved ? (
              <div className={styles.loading}><div className={styles.spinner} /></div>
            ) : bookmarks.length === 0 ? (
              <div className={styles.empty}>
                <span>♡</span>
                <h3>No saved listings yet</h3>
                <p>Browse listings and tap the heart icon to save them here.</p>
                <button onClick={() => navigate('/browse')}>Browse Listings →</button>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {bookmarks.map(b => (
                  <ListingMiniCard
                    key={b.id}
                    listing={b.listing_data}
                    onUnbookmark={handleUnbookmark}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECENTLY VIEWED */}
        {activeTab === 'recent' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Recently Viewed</h2>
              <p>Listings you've looked at recently</p>
              {recentListings.length > 0 && (
                <button
                  className={styles.clearBtn}
                  onClick={() => { localStorage.removeItem('hausio_recent'); setRecentListings([]); }}
                >
                  Clear history
                </button>
              )}
            </div>
            {loadingRecent ? (
              <div className={styles.loading}><div className={styles.spinner} /></div>
            ) : recentListings.length === 0 ? (
              <div className={styles.empty}>
                <span>🕐</span>
                <h3>No recently viewed listings</h3>
                <p>Listings you view will appear here.</p>
                <button onClick={() => navigate('/browse')}>Start Browsing →</button>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {recentListings.map(l => (
                  <ListingMiniCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY REVIEWS */}
        {activeTab === 'reviews' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>My Reviews</h2>
              <p>Reviews you've left on listings</p>
            </div>
            {loadingReviews ? (
              <div className={styles.loading}><div className={styles.spinner} /></div>
            ) : myReviews.length === 0 ? (
              <div className={styles.empty}>
                <span>★</span>
                <h3>No reviews yet</h3>
                <p>Visit a listing and leave a review to help other tenants.</p>
                <button onClick={() => navigate('/browse')}>Browse Listings →</button>
              </div>
            ) : (
              <div className={styles.reviewsList}>
                {myReviews.map(r => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewInfo}>
                        <h4 onClick={() => navigate(`/listings/${r.listing}`)} className={styles.reviewListingTitle}>
                          {r.listing_title || 'View Listing →'}
                        </h4>
                        <StarDisplay rating={r.rating} />
                      </div>
                      <span className={styles.reviewDate}>
                        {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className={styles.reviewComment}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEARCH PREFS */}
        {activeTab === 'prefs' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Search Preferences</h2>
              <p>Save your preferred filters so you can browse faster</p>
            </div>
            <div className={styles.prefsCard}>
              <div className={styles.prefsGrid}>
                <div className={styles.prefField}>
                  <label>Preferred Area</label>
                  <select value={prefs.area} onChange={e => setPrefs(p => ({ ...p, area: e.target.value }))}>
                    <option value="">Any area</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className={styles.prefField}>
                  <label>Max Rent (KES)</label>
                  <input
                    type="number"
                    placeholder="e.g. 20000"
                    value={prefs.max_rent}
                    onChange={e => setPrefs(p => ({ ...p, max_rent: e.target.value }))}
                  />
                </div>
                <div className={styles.prefField}>
                  <label>Bedrooms</label>
                  <div className={styles.bedroomBtns}>
                    {[['','Any'],['0','Bedsitter'],['1','1 Bed'],['2','2 Beds'],['3','3+ Beds']].map(([v, l]) => (
                      <button
                        key={v}
                        className={prefs.bedrooms === v ? styles.bedroomBtnActive : styles.bedroomBtn}
                        onClick={() => setPrefs(p => ({ ...p, bedrooms: v }))}
                      >{l}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.prefField}>
                  <label>Furnished</label>
                  <div className={styles.bedroomBtns}>
                    {[['','Any'],['true','Furnished'],['false','Unfurnished']].map(([v, l]) => (
                      <button
                        key={v}
                        className={prefs.is_furnished === v ? styles.bedroomBtnActive : styles.bedroomBtn}
                        onClick={() => setPrefs(p => ({ ...p, is_furnished: v }))}
                      >{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.prefsActions}>
                <button className={styles.savePrefsBtn} onClick={handleSavePrefs}>
                  {prefsSaved ? '✓ Saved!' : 'Save Preferences'}
                </button>
                <button className={styles.browseWithPrefsBtn} onClick={handleBrowseWithPrefs}>
                  Browse with these filters →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>My Profile</h2>
              <p>Update your account details</p>
            </div>
            <div className={styles.profileGrid}>

              {/* Profile details */}
              <div className={styles.profileCard}>
                <h3>Personal Details</h3>
                <form onSubmit={handleProfileSave}>
                  <div className={styles.formField}>
                    <label>Username</label>
                    <input
                      value={profileForm.username}
                      onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Phone Number</label>
                    <input
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. 0712 345 678"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Email</label>
                    <input value={user?.email} disabled className={styles.disabledInput} />
                  </div>
                  <div className={styles.formField}>
                    <label>Account Type</label>
                    <input value="Tenant" disabled className={styles.disabledInput} />
                  </div>
                  {profileMsg && (
                    <div className={profileMsg.startsWith('✓') ? styles.successMsg : styles.errorMsg}>
                      {profileMsg}
                    </div>
                  )}
                  <button type="submit" className={styles.saveBtn} disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Change password */}
              <div className={styles.profileCard}>
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className={styles.formField}>
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={pwForm.current}
                      onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>New Password</label>
                    <input
                      type="password"
                      value={pwForm.new1}
                      onChange={e => setPwForm(p => ({ ...p, new1: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={pwForm.new2}
                      onChange={e => setPwForm(p => ({ ...p, new2: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {pwMsg && (
                    <div className={pwMsg.startsWith('✓') ? styles.successMsg : styles.errorMsg}>
                      {pwMsg}
                    </div>
                  )}
                  <button type="submit" className={styles.saveBtn} disabled={pwSaving}>
                    {pwSaving ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
