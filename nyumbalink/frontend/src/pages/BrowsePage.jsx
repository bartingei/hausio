import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './BrowsePage.module.css';

const AREAS = ['Rongai','Kasarani','Kilimani','Westlands','Embakasi','Ngong Road','Lavington','Langata','Ruaka','Ruiru','Thika Road','South B','South C'];
const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '0', label: 'Bedsitter' },
  { value: '1', label: '1 Bed' },
  { value: '2', label: '2 Beds' },
  { value: '3', label: '3+ Beds' },
];

function StarRating({ rating, count }) {
  if (!rating) return <span className={styles.noRating}>No reviews yet</span>;
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= Math.round(rating) ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
      <span className={styles.ratingText}>{rating} ({count})</span>
    </div>
  );
}

function ListingCard({ listing, onBookmarkToggle, bookmarked, compareMode, compareSelected, onCompareToggle }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const primary = listing.photos?.find(p => p.is_primary) || listing.photos?.[0];

  const handleBookmark = (e) => {
    e.stopPropagation();
    onBookmarkToggle(listing.id);
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    onCompareToggle(listing);
  };

  return (
    <div
      className={`${styles.card} ${compareSelected ? styles.cardSelected : ''}`}
      onClick={() => navigate(`/listings/${listing.id}`)}
    >
      <div className={styles.cardImg}>
        {primary
          ? <img src={primary.image} alt={listing.title} />
          : <div className={styles.noImg}>📷</div>
        }
        <div className={styles.cardBadges}>
          {listing.is_furnished && <span className={styles.badgeFurnished}>Furnished</span>}
          {listing.landlord_verified && <span className={styles.badgeVerified}>✓ Verified</span>}
        </div>
        {user && (
          <button
            className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarkActive : ''}`}
            onClick={handleBookmark}
            title={bookmarked ? 'Remove bookmark' : 'Save listing'}
          >
            {bookmarked ? '♥' : '♡'}
          </button>
        )}
        {compareMode && (
          <button
            className={`${styles.compareBtn} ${compareSelected ? styles.compareBtnActive : ''}`}
            onClick={handleCompare}
          >
            {compareSelected ? '✓' : '+'}
          </button>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardArea}>📍 {listing.area_name}</div>
        <h3 className={styles.cardTitle}>{listing.title}</h3>
        <StarRating rating={listing.avg_rating} count={listing.review_count} />
        <div className={styles.cardFooter}>
          <div className={styles.cardPrice}>
            KES {listing.rent_kes?.toLocaleString()}
            <span>/mo</span>
          </div>
          <div className={styles.cardMeta}>
            {listing.bedrooms === 0 ? 'Bedsitter' : `${listing.bedrooms} bed`}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareModal({ listings, onClose }) {
  const navigate = useNavigate();
  const fields = [
    { label: 'Price', key: 'rent_kes', format: v => `KES ${v?.toLocaleString()}/mo` },
    { label: 'Bedrooms', key: 'bedrooms', format: v => v === 0 ? 'Bedsitter' : `${v} bed` },
    { label: 'Furnished', key: 'is_furnished', format: v => v ? '✓ Yes' : '✗ No' },
    { label: 'Area', key: 'area_name', format: v => v },
    { label: 'Rating', key: 'avg_rating', format: v => v ? `${v} ★` : 'No reviews' },
    { label: 'Reviews', key: 'review_count', format: v => v || 0 },
    { label: 'Verified Landlord', key: 'landlord_verified', format: v => v ? '✓ Yes' : '✗ No' },
  ];

  return (
    <div className={styles.compareOverlay} onClick={onClose}>
      <div className={styles.compareModal} onClick={e => e.stopPropagation()}>
        <div className={styles.compareHeader}>
          <h2>Compare Listings</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className={styles.compareGrid} style={{ gridTemplateColumns: `180px repeat(${listings.length}, 1fr)` }}>
          <div className={styles.compareLabels}>
            <div className={styles.compareImgCell} />
            <div className={styles.compareTitleCell} />
            {fields.map(f => (
              <div key={f.label} className={styles.compareLabel}>{f.label}</div>
            ))}
            <div className={styles.compareLabel} />
          </div>
          {listings.map(l => {
            const primary = l.photos?.find(p => p.is_primary) || l.photos?.[0];
            return (
              <div key={l.id} className={styles.compareCol}>
                <div className={styles.compareImgCell}>
                  {primary
                    ? <img src={primary.image} alt={l.title} />
                    : <div className={styles.noImgSm}>📷</div>
                  }
                </div>
                <div className={styles.compareTitleCell}>{l.title}</div>
                {fields.map(f => (
                  <div key={f.label} className={styles.compareValue}>
                    {f.format(l[f.key])}
                  </div>
                ))}
                <div className={styles.compareValue}>
                  <button
                    className={styles.compareViewBtn}
                    onClick={() => { navigate(`/listings/${l.id}`); onClose(); }}
                  >
                    View →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const { user } = useAuth();
  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [area, setArea]                 = useState('');
  const [bedrooms, setBedrooms]         = useState('');
  const [furnished, setFurnished]       = useState('');
  const [maxRent, setMaxRent]           = useState('');
  const [bookmarks, setBookmarks]       = useState(new Set());
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [compareMode, setCompareMode]   = useState(false);
  const [compareList, setCompareList]   = useState([]);
  const [showCompare, setShowCompare]   = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [activeTab, setActiveTab]       = useState('all'); // all | saved | recent

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)   params.search      = search;
      if (area)     params.area_name   = area;
      if (bedrooms !== '') params.bedrooms = bedrooms;
      if (furnished) params.is_furnished = furnished;
      if (maxRent)  params.max_rent    = maxRent;
      const res = await api.get('/listings/', { params });
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, area, bedrooms, furnished, maxRent]);

  useEffect(() => {
    const timer = setTimeout(fetchListings, 400);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  useEffect(() => {
    if (user) fetchBookmarks();
    const rv = JSON.parse(localStorage.getItem('hausio_recent') || '[]');
    setRecentlyViewed(rv);
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/listings/bookmarks/');
      setBookmarks(new Set(res.data.map(b => b.listing)));
    } catch (err) {}
  };

  const handleBookmarkToggle = async (id) => {
    if (!user) return alert('Log in to save listings');
    try {
      const res = await api.post(`/listings/${id}/bookmark/`);
      setBookmarks(prev => {
        const next = new Set(prev);
        if (res.data.bookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch (err) {}
  };

  const handleCompareToggle = (listing) => {
    setCompareList(prev => {
      const exists = prev.find(l => l.id === listing.id);
      if (exists) return prev.filter(l => l.id !== listing.id);
      if (prev.length >= 3) return prev;
      return [...prev, listing];
    });
  };

  const clearFilters = () => {
    setSearch(''); setArea(''); setBedrooms('');
    setFurnished(''); setMaxRent('');
  };

  const hasFilters = search || area || bedrooms !== '' || furnished || maxRent;

  const displayListings = activeTab === 'saved'
    ? listings.filter(l => bookmarks.has(l.id))
    : activeTab === 'recent'
    ? recentlyViewed.map(id => listings.find(l => l.id === id)).filter(Boolean)
    : listings;

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search by area, title or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
          </div>
          <button
            className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            ⚙ Filters {hasFilters && <span className={styles.filterDot} />}
          </button>
          <button
            className={`${styles.compareToggle} ${compareMode ? styles.compareToggleActive : ''}`}
            onClick={() => { setCompareMode(v => !v); setCompareList([]); }}
          >
            ⇄ Compare {compareMode && compareList.length > 0 && `(${compareList.length})`}
          </button>
          {compareMode && compareList.length >= 2 && (
            <button className={styles.compareViewBtn2} onClick={() => setShowCompare(true)}>
              Compare {compareList.length} →
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>Area</label>
                <select value={area} onChange={e => setArea(e.target.value)}>
                  <option value="">All areas</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Bedrooms</label>
                <div className={styles.bedroomBtns}>
                  {BEDROOM_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      className={bedrooms === o.value ? styles.bedroomBtnActive : styles.bedroomBtn}
                      onClick={() => setBedrooms(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroup}>
                <label>Furnished</label>
                <select value={furnished} onChange={e => setFurnished(e.target.value)}>
                  <option value="">Any</option>
                  <option value="true">Furnished</option>
                  <option value="false">Unfurnished</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Max Rent (KES)</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={maxRent}
                  onChange={e => setMaxRent(e.target.value)}
                />
              </div>
              {hasFilters && (
                <button className={styles.clearFilters} onClick={clearFilters}>
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.main}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={activeTab === 'all' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('all')}
          >
            All listings
            <span className={styles.tabCount}>{listings.length}</span>
          </button>
          {user && (
            <button
              className={activeTab === 'saved' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('saved')}
            >
              ♥ Saved
              <span className={styles.tabCount}>{bookmarks.size}</span>
            </button>
          )}
          {recentlyViewed.length > 0 && (
            <button
              className={activeTab === 'recent' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('recent')}
            >
              🕐 Recently viewed
            </button>
          )}
        </div>

        {/* Compare hint */}
        {compareMode && (
          <div className={styles.compareHint}>
            Select up to 3 listings to compare side by side.
            {compareList.length > 0 && ` ${compareList.length} selected.`}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : displayListings.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏠</div>
            <h3>No listings found</h3>
            <p>{hasFilters ? 'Try adjusting your filters.' : 'Check back soon — new listings are added daily.'}</p>
            {hasFilters && <button className={styles.clearFilters} onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {displayListings.map(l => (
              <ListingCard
                key={l.id}
                listing={l}
                bookmarked={bookmarks.has(l.id)}
                onBookmarkToggle={handleBookmarkToggle}
                compareMode={compareMode}
                compareSelected={compareList.some(c => c.id === l.id)}
                onCompareToggle={handleCompareToggle}
              />
            ))}
          </div>
        )}
      </div>

      {showCompare && (
        <CompareModal
          listings={compareList}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}
