import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './LandlordDashboard.module.css';

const EMPTY_FORM = {
  title: '', description: '', rent_kes: '',
  bedrooms: '0', is_furnished: false,
  area_name: '', location_lat: '', location_lng: '',
  maps_link: '',
};

const STATUS_CONFIG = {
  verified:  { label: 'Live',    color: '#1E7C47', bg: '#D4EFDF' },
  pending:   { label: 'Pending', color: '#B45309', bg: '#FEF3C7' },
  rejected:  { label: 'Rejected',color: '#9B2335', bg: '#FADBD8' },
  reserved:  { label: 'Reserved',color: '#1A56A0', bg: '#DBEAFE' },
  taken:     { label: 'Taken',   color: '#666',    bg: '#F3F4F6' },
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [photos, setPhotos]           = useState([]);
  const [editingId, setEditingId]     = useState(null);
  const [saving, setSaving]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeFilter, setActiveFilter]   = useState('all');
  const [error, setError]             = useState('');

  useEffect(() => {
    if (!user || user.role !== 'landlord') { navigate('/'); return; }
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/listings/mine/');
      setListings(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMapsLink = (url) => {
    setForm(prev => ({ ...prev, maps_link: url, location_lat: '', location_lng: '' }));
    const patterns = [
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) {
        setForm(prev => ({ ...prev, maps_link: url, location_lat: m[1], location_lng: m[2] }));
        return;
      }
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotos([]);
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditForm = (listing) => {
    setEditingId(listing.id);
    setForm({
      title:        listing.title,
      description:  listing.description,
      rent_kes:     listing.rent_kes,
      bedrooms:     String(listing.bedrooms),
      is_furnished: listing.is_furnished,
      area_name:    listing.area_name,
      location_lat: listing.location_lat || '',
      location_lng: listing.location_lng || '',
      maps_link:    '',
    });
    setPhotos([]);
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k !== 'maps_link') data.append(k, v);
    });
    photos.forEach(p => data.append('uploaded_images', p));
    try {
      if (editingId) {
        await api.patch(`/listings/${editingId}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/listings/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setPhotos([]);
      setEditingId(null);
      fetchListings();
    } catch (err) {
      setError('Failed to save listing. Please check all fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/listings/${id}/`);
      setDeleteConfirm(null);
      fetchListings();
    } catch { alert('Failed to delete.'); }
  };

  const filteredListings = activeFilter === 'all'
    ? listings
    : listings.filter(l => l.status === activeFilter);

  const stats = {
    total:    listings.length,
    live:     listings.filter(l => l.status === 'verified').length,
    pending:  listings.filter(l => l.status === 'pending').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1>My Listings</h1>
            <p>Welcome back{user?.username ? `, ${user.username}` : ''}. Manage your properties below.</p>
          </div>
          <button className={styles.newBtn} onClick={openNewForm}>
            + New Listing
          </button>
        </div>

        {/* ── Stats ── */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: '#1E7C47' }}>{stats.live}</span>
            <span className={styles.statLabel}>Live</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: '#B45309' }}>{stats.pending}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: '#9B2335' }}>{stats.rejected}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
        </div>

        {/* ── Form ── */}
        {showForm && (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>{editingId ? 'Edit Listing' : 'New Listing'}</h2>
              <button className={styles.closeForm} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                {/* Title */}
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Cosy 1BR in Kilimani"
                    required
                  />
                </div>

                {/* Description */}
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the property — security, nearby amenities, access road..."
                    rows={4}
                  />
                </div>

                {/* Rent */}
                <div className={styles.field}>
                  <label>Monthly Rent (KES) *</label>
                  <input
                    type="number"
                    value={form.rent_kes}
                    onChange={e => setForm({ ...form, rent_kes: e.target.value })}
                    placeholder="e.g. 15000"
                    required
                  />
                </div>

                {/* Area */}
                <div className={styles.field}>
                  <label>Area *</label>
                  <input
                    value={form.area_name}
                    onChange={e => setForm({ ...form, area_name: e.target.value })}
                    placeholder="e.g. Rongai, Kasarani"
                    required
                  />
                </div>

                {/* Bedrooms */}
                <div className={styles.field}>
                  <label>Bedrooms</label>
                  <div className={styles.bedroomBtns}>
                    {[['0','Bedsitter'],['1','1 Bed'],['2','2 Beds'],['3','3 Beds']].map(([v, l]) => (
                      <button
                        key={v} type="button"
                        className={form.bedrooms === v ? styles.bedroomBtnActive : styles.bedroomBtn}
                        onClick={() => setForm({ ...form, bedrooms: v })}
                      >{l}</button>
                    ))}
                  </div>
                </div>

                {/* Furnished */}
                <div className={styles.field}>
                  <label>Furnished</label>
                  <div className={styles.toggleRow}>
                    <button
                      type="button"
                      className={form.is_furnished ? styles.toggleActive : styles.toggle}
                      onClick={() => setForm({ ...form, is_furnished: true })}
                    >✓ Furnished</button>
                    <button
                      type="button"
                      className={!form.is_furnished ? styles.toggleActive : styles.toggle}
                      onClick={() => setForm({ ...form, is_furnished: false })}
                    >✗ Unfurnished</button>
                  </div>
                </div>

                {/* Maps link */}
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Google Maps Link (optional)</label>
                  <input
                    value={form.maps_link}
                    onChange={e => handleMapsLink(e.target.value)}
                    placeholder="Paste Google Maps link — e.g. https://maps.google.com/?q=-1.29,36.82"
                  />
                  {form.location_lat && form.location_lng && (
                    <span className={styles.locationOk}>
                      ✅ Location: {parseFloat(form.location_lat).toFixed(4)}, {parseFloat(form.location_lng).toFixed(4)}
                    </span>
                  )}
                  {form.maps_link && !form.location_lat && (
                    <span className={styles.locationErr}>⚠️ Could not read coordinates. Try the share link from Google Maps.</span>
                  )}
                </div>

              {/* Photos */}
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Photos (max 4) {!editingId && '*'}</label>
                <div
                  className={styles.photoDropzone}
                  onClick={() => document.getElementById('photoInput').click()}
                >
                  <input
                    id="photoInput"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => {
                      const selected = Array.from(e.target.files).slice(0, 4);
                      setPhotos(selected);
                    }}
                  />
                  {photos.length > 0 ? (
                    <div className={styles.photoPreviewRow}>
                      {photos.map((p, i) => (
                        <div key={i} className={styles.photoPreview}>
                          <img src={URL.createObjectURL(p)} alt="" />
                          {i === 0 && <span className={styles.primaryTag}>Primary</span>}
                          <button
                            type="button"
                            className={styles.removePhoto}
                            onClick={e => {
                              e.stopPropagation();
                              setPhotos(prev => prev.filter((_, idx) => idx !== i));
                            }}
                          >✕</button>
                        </div>
                      ))}
                      {photos.length < 4 && (
                        <div className={styles.addMorePhoto}>+ Add more</div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.dropzoneEmpty}>
                      <span className={styles.dropzoneIcon}>📷</span>
                      <span>Click to upload up to 4 photos</span>
                      <span className={styles.dropzoneSub}>First photo will be the cover image</span>
                    </div>
                  )}
                </div>
                {photos.length === 4 && (
                  <span style={{ fontSize: 12, color: '#B45309', fontWeight: 600, marginTop: 4 }}>
                    Maximum 4 photos reached
                  </span>
                )}
              </div>
                  
              </div>

              {error && <div className={styles.formError}>{error}</div>}

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className={styles.filterTabs}>
          {['all','verified','pending','rejected'].map(f => (
            <button
              key={f}
              className={activeFilter === f ? styles.filterTabActive : styles.filterTab}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'verified' ? 'Live' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={styles.filterCount}>
                {f === 'all' ? listings.length : listings.filter(l => l.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Listings ── */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className={styles.empty}>
            <span>🏠</span>
            <h3>{activeFilter === 'all' ? 'No listings yet' : `No ${activeFilter} listings`}</h3>
            {activeFilter === 'all' && (
              <p>Add your first property and start getting genuine tenants.</p>
            )}
            {activeFilter === 'all' && (
              <button className={styles.newBtn} onClick={openNewForm}>+ Add your first listing</button>
            )}
          </div>
        ) : (
          <div className={styles.listingGrid}>
            {filteredListings.map(l => {
              const primary = l.photos?.find(p => p.is_primary) || l.photos?.[0];
              const s = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending;
              return (
                <div key={l.id} className={styles.listingCard}>
                  <div className={styles.listingImg}>
                    {primary
                      ? <img src={primary.image} alt={l.title} />
                      : <div className={styles.noImg}>📷</div>
                    }
                    <span className={styles.statusPill} style={{ color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                  </div>
                  <div className={styles.listingBody}>
                    <div className={styles.listingArea}>📍 {l.area_name}</div>
                    <h3 className={styles.listingTitle}>{l.title}</h3>
                    <div className={styles.listingPrice}>
                      KES {l.rent_kes?.toLocaleString()}
                      <span>/mo</span>
                    </div>
                    <div className={styles.listingMeta}>
                      <span>{l.bedrooms === 0 ? 'Bedsitter' : `${l.bedrooms} bed`}</span>
                      {l.is_furnished && <span>Furnished</span>}
                      {l.avg_rating && (
                        <span>★ {l.avg_rating} ({l.review_count})</span>
                      )}
                    </div>
                    {l.status === 'rejected' && (
                      <div className={styles.rejectedNote}>
                        This listing was rejected. Edit and resubmit for review.
                      </div>
                    )}
                    <div className={styles.listingActions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => openEditForm(l)}
                      >✏ Edit</button>
                      <button
                        className={styles.viewBtn}
                        onClick={() => navigate(`/listings/${l.id}`)}
                      >👁 View</button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteConfirm({ id: l.id, title: l.title })}
                      >🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Listing?"
          message={`This will permanently remove "${deleteConfirm.title}". This cannot be undone.`}
          confirmLabel="🗑️ Delete"
          confirmColor="#9B2335"
          onConfirm={() => handleDelete(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
