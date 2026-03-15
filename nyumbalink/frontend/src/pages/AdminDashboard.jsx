import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './AdminDashboard.module.css';

const STATUS_CONFIG = {
  verified: { label: 'Live',     color: '#1E7C47', bg: '#D4EFDF' },
  pending:  { label: 'Pending',  color: '#B45309', bg: '#FEF3C7' },
  rejected: { label: 'Rejected', color: '#9B2335', bg: '#FADBD8' },
  reserved: { label: 'Reserved', color: '#1A56A0', bg: '#DBEAFE' },
  taken:    { label: 'Taken',    color: '#666',    bg: '#F3F4F6' },
};

function SafetyForm({ area, onSaved }) {
  const [form, setForm] = useState({
    area_name: area, safety_score: 3,
    lighting: 3, transport: 3, noise_level: 3, notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/listings/safety/', form);
      onSaved();
    } catch (err) {
      alert('Failed to save safety data.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.safetyForm} onSubmit={handleSubmit}>
      <h4>Set Neighbourhood Safety — {area}</h4>
      {[
        { key: 'safety_score', label: 'Safety Score' },
        { key: 'lighting',     label: 'Lighting' },
        { key: 'transport',    label: 'Transport' },
        { key: 'noise_level',  label: 'Noise Level' },
      ].map(f => (
        <div key={f.key} className={styles.safetyRow}>
          <label>{f.label}</label>
          <div className={styles.safetyBtns}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n} type="button"
                className={form[f.key] === n ? styles.safetyBtnActive : styles.safetyBtn}
                onClick={() => setForm(prev => ({ ...prev, [f.key]: n }))}
              >{n}</button>
            ))}
          </div>
        </div>
      ))}
      <textarea
        placeholder="Additional notes about this area (optional)"
        value={form.notes}
        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
        rows={2}
      />
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Safety Data'}
      </button>
    </form>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('pending');
  const [expanded, setExpanded]     = useState(null);
  const [dialog, setDialog]         = useState(null);
  const [showSafetyForm, setShowSafetyForm] = useState(null);
  const [search, setSearch]         = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/listings/all/', { params: { status: filter } });
      setListings(res.data);
      setExpanded(null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const handleApproval = (id, status) => {
    const configs = {
      verified: { title: 'Approve Listing?',   message: 'This listing will go live and be visible to all tenants.', confirmLabel: '✓ Approve', confirmColor: '#1E7C47' },
      rejected: { title: 'Reject Listing?',    message: 'This listing will be hidden and marked as rejected.',      confirmLabel: '✗ Reject',  confirmColor: '#9B2335' },
      pending:  { title: 'Revoke Approval?',   message: 'This listing will be removed from public view.',           confirmLabel: '↩ Revoke',  confirmColor: '#C0622A' },
    };
    const config = configs[status];
    setDialog({
      ...config,
      onConfirm: async () => {
        try {
          await api.patch(`/listings/${id}/approve/`, { status });
          setDialog(null);
          fetchListings();
        } catch { setDialog(null); alert('Action failed.'); }
      }
    });
  };

  const handleDelete = (id, title) => {
    setDialog({
      title: 'Delete Listing?',
      message: `Permanently remove "${title}"? This cannot be undone.`,
      confirmLabel: '🗑️ Delete',
      confirmColor: '#9B2335',
      onConfirm: async () => {
        try {
          await api.delete(`/listings/${id}/admin-delete/`);
          setDialog(null);
          fetchListings();
        } catch { setDialog(null); alert('Failed to delete.'); }
      }
    });
  };

  const verifyLandlord = async (email) => {
    try {
      await api.post('/accounts/verify-landlord/', { email });
      fetchListings();
    } catch { alert('Failed to verify landlord.'); }
  };

  const filtered = listings.filter(l =>
    !search ||
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.area_name.toLowerCase().includes(search.toLowerCase()) ||
    l.landlord_email.toLowerCase().includes(search.toLowerCase())
  );

  const allStats = {
    pending:  listings.filter(l => l.status === 'pending').length,
    verified: listings.filter(l => l.status === 'verified').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  };

  const TABS = [
    { key: 'pending',  label: 'Pending Review' },
    { key: 'verified', label: 'Live' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Review listings, verify landlords, manage the platform.</p>
          </div>
          <div className={styles.headerSearch}>
            <span>🔍</span>
            <input
              placeholder="Search listings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Stats ── */}
        <div className={styles.statsRow}>
          <div className={styles.statCard} onClick={() => setFilter('pending')} style={{ cursor: 'pointer' }}>
            <span className={styles.statNum} style={{ color: '#B45309' }}>{allStats.pending}</span>
            <span className={styles.statLabel}>Awaiting Review</span>
          </div>
          <div className={styles.statCard} onClick={() => setFilter('verified')} style={{ cursor: 'pointer' }}>
            <span className={styles.statNum} style={{ color: '#1E7C47' }}>{allStats.verified}</span>
            <span className={styles.statLabel}>Live Listings</span>
          </div>
          <div className={styles.statCard} onClick={() => setFilter('rejected')} style={{ cursor: 'pointer' }}>
            <span className={styles.statNum} style={{ color: '#9B2335' }}>{allStats.rejected}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{listings.length}</span>
            <span className={styles.statLabel}>Total ({filter})</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={filter === t.key ? styles.tabActive : styles.tab}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
              {filter !== t.key && (
                <span className={styles.tabCount}>
                  {t.key === 'pending' ? allStats.pending : t.key === 'verified' ? allStats.verified : allStats.rejected}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>📋</span>
            <h3>{search ? 'No results found' : `No ${filter} listings`}</h3>
            {search && <p>Try a different search term.</p>}
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(l => {
              const s = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending;
              const isExpanded = expanded === l.id;
              return (
                <div key={l.id} className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''}`}>

                  {/* Card header */}
                  <div className={styles.cardHeader} onClick={() => setExpanded(isExpanded ? null : l.id)}>
                    <div className={styles.cardLeft}>
                      {l.photos?.[0] && (
                        <div className={styles.cardThumb}>
                          <img src={l.photos[0].image} alt={l.title} />
                        </div>
                      )}
                      <div className={styles.cardInfo}>
                        <div className={styles.cardTitleRow}>
                          <h3>{l.title}</h3>
                          <span className={styles.statusPill} style={{ color: s.color, background: s.bg }}>
                            {s.label}
                          </span>
                        </div>
                        <div className={styles.cardMeta}>
                          <span>📍 {l.area_name}</span>
                          <span>KES {l.rent_kes?.toLocaleString()}/mo</span>
                          <span>🛏 {l.bedrooms === 0 ? 'Bedsitter' : `${l.bedrooms} bed`}</span>
                          {l.is_furnished && <span>🪑 Furnished</span>}
                        </div>
                        <div className={styles.landlordRow}>
                          <span className={styles.landlordEmail}>👤 {l.landlord_email}</span>
                          {l.landlord_verified
                            ? <span className={styles.verifiedTag}>✓ ID Verified</span>
                            : <span className={styles.unverifiedTag}>⏳ ID Pending</span>
                          }
                          {l.avg_rating && (
                            <span className={styles.ratingTag}>★ {l.avg_rating} ({l.review_count})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className={styles.expanded}>

                      {/* Photos */}
                      {l.photos?.length > 0 ? (
                        <div className={styles.photoStrip}>
                          {l.photos.map((p, i) => (
                            <img
                              key={p.id}
                              src={p.image}
                              alt={`Photo ${i + 1}`}
                              className={styles.photo}
                              onClick={() => window.open(p.image, '_blank')}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className={styles.noPhotos}>📷 No photos uploaded</div>
                      )}

                      {/* Description */}
                      {l.description && (
                        <div className={styles.descSection}>
                          <h4>Description</h4>
                          <p>{l.description}</p>
                        </div>
                      )}

                      {/* Location */}
                      {l.location_lat && l.location_lng && (
                        <div className={styles.descSection}>
                          <h4>Location</h4>
                          <a
                            href={`https://www.google.com/maps?q=${l.location_lat},${l.location_lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.mapsLink}
                          >
                            📍 View on Google Maps →
                          </a>
                        </div>
                      )}

                      {/* Safety form toggle */}
                      <div className={styles.descSection}>
                        <h4>Neighbourhood Safety</h4>
                        {showSafetyForm === l.id ? (
                          <SafetyForm
                            area={l.area_name}
                            onSaved={() => setShowSafetyForm(null)}
                          />
                        ) : (
                          <button
                            className={styles.safetyToggleBtn}
                            onClick={() => setShowSafetyForm(l.id)}
                          >
                            🛡️ Set safety score for {l.area_name}
                          </button>
                        )}
                      </div>

                      {/* Reviews summary */}
                      {l.review_count > 0 && (
                        <div className={styles.descSection}>
                          <h4>Reviews</h4>
                          <span className={styles.reviewSummary}>
                            ★ {l.avg_rating} average from {l.review_count} review{l.review_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className={styles.actionBar}>
                        {!l.landlord_verified && (
                          <button className={styles.verifyLandlordBtn} onClick={() => verifyLandlord(l.landlord_email)}>
                            ✓ Verify Landlord ID
                          </button>
                        )}
                        {filter === 'pending' && (
                          <>
                            <button className={styles.approveBtn} onClick={() => handleApproval(l.id, 'verified')}>
                              ✓ Approve
                            </button>
                            <button className={styles.rejectBtn} onClick={() => handleApproval(l.id, 'rejected')}>
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {filter === 'verified' && (
                          <button className={styles.revokeBtn} onClick={() => handleApproval(l.id, 'pending')}>
                            ↩ Revoke
                          </button>
                        )}
                        {filter === 'rejected' && (
                          <button className={styles.approveBtn} onClick={() => handleApproval(l.id, 'verified')}>
                            ✓ Approve Anyway
                          </button>
                        )}
                        <button
                          className={styles.viewBtn}
                          onClick={() => navigate(`/listings/${l.id}`)}
                        >
                          👁 View Public Page
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(l.id, l.title)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          confirmColor={dialog.confirmColor}
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
