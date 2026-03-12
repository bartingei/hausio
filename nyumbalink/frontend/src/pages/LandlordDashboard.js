import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './LandlordDashboard.module.css';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_COLORS = {
  pending:  { bg: '#FDEBD0', color: '#C0622A', label: '⏳ Pending' },
  verified: { bg: '#D4EFDF', color: '#1E7C47', label: '✓ Verified' },
  rejected: { bg: '#FADBD8', color: '#9B2335', label: '✗ Rejected' },
  reserved: { bg: '#D6E4F7', color: '#1A56A0', label: '🔒 Reserved' },
  taken:    { bg: '#f0f0f0', color: '#666',    label: '✗ Taken' },
};

const EMPTY_FORM = {
  title: '', description: '', rent_kes: '',
  bedrooms: '0', is_furnished: false,
  area_name: '', location_lat: '', location_lng: '',
  maps_link: '',
};

function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [photos, setPhotos]       = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'landlord') { navigate('/login'); return; }
    fetchMyListings();
  }, [user, navigate]);

  const fetchMyListings = async () => {
    try {
      const res = await api.get('/listings/mine/');
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotos([]);
    setShowForm(true);
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
  setShowForm(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      photos.forEach(photo => formData.append('uploaded_images', photo));

      if (editingId) {
        await api.patch(`/listings/${editingId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/listings/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setPhotos([]);
      fetchMyListings();
    } catch (err) {
      alert('Failed to submit listing. Check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/listings/${id}/`);
      setDeleteConfirm(null);
      fetchMyListings();
    } catch (err) {
      alert('Could not delete listing.');
    }
  };

  const toggleAvailability = async (listing) => {
    const newStatus = listing.status === 'taken' ? 'verified' : 'taken';
    try {
      await api.patch(`/listings/${listing.id}/`, { status: newStatus });
      fetchMyListings();
    } catch (err) {
      alert('Could not update status.');
    }
  };

  const handleMapsLink = (url) => {
  setForm(prev => ({ ...prev, maps_link: url }));

  // Try to extract coordinates from various Google Maps URL formats
  const patterns = [
    // ?q=-1.2921,36.8219
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // @-1.2921,36.8219
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // /place/.../@-1.2921,36.8219
    /\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // ll=-1.2921,36.8219
    /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      setForm(prev => ({
        ...prev,
        maps_link: url,
        location_lat: match[1],
        location_lng: match[2],
      }));
      return;
    }
  }

  // Clear coordinates if link changed and no match found
  setForm(prev => ({ ...prev, location_lat: '', location_lng: '' }));
};


  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div>
            <h1>My Listings</h1>
            <p>Manage your properties on Hausio</p>
          </div>
          <button className={styles.addBtn} onClick={showForm ? () => setShowForm(false) : openAddForm}>
            {showForm ? '✕ Cancel' : '+ Add Listing'}
          </button>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className={styles.formCard}>
            <h2>{editingId ? 'Edit Listing' : 'New Listing'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Title</label>
                  <input required value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Cosy Bedsitter in Rongai" />
                </div>
                <div className={styles.field}>
                  <label>Area</label>
                  <input required value={form.area_name}
                    onChange={e => setForm({...form, area_name: e.target.value})}
                    placeholder="e.g. Rongai" />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Monthly Rent (KES)</label>
                  <input required type="number" value={form.rent_kes}
                    onChange={e => setForm({...form, rent_kes: e.target.value})}
                    placeholder="8000" />
                </div>
                <div className={styles.field}>
                  <label>Bedrooms</label>
                  <select value={form.bedrooms}
                    onChange={e => setForm({...form, bedrooms: e.target.value})}>
                    <option value="0">Bedsitter</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                  </select>
                </div>
              </div>

                <div className={styles.field}>
                    <label>Google Maps Link (optional)</label>
                    <input
                        value={form.maps_link}
                        onChange={e => handleMapsLink(e.target.value)}
                        placeholder="Paste Google Maps link here e.g. https://maps.google.com/?q=-1.29,36.82"
                    />
                    {form.location_lat && form.location_lng && (
                        <p className={styles.photoCount}>
                        ✅ Location detected: {parseFloat(form.location_lat).toFixed(4)}, {parseFloat(form.location_lng).toFixed(4)}
                        </p>
                    )}
                    {form.maps_link && !form.location_lat && (
                        <p style={{color: '#9B2335', fontSize: 13, marginTop: 4}}>
                        ⚠️ Could not read coordinates from this link. Try copying the link from Google Maps share button.
                        </p>
                    )}
                </div>

              <div className={styles.field}>
                <label>Description</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Describe the property..." />
              </div>
              <div className={styles.checkRow}>
                <input type="checkbox" id="furnished" checked={form.is_furnished}
                  onChange={e => setForm({...form, is_furnished: e.target.checked})} />
                <label htmlFor="furnished">Furnished</label>
              </div>
              <div className={styles.field}>
                <label>Photos {editingId && '(upload new to replace existing)'}</label>
                <input type="file" multiple accept="image/*"
                  onChange={e => setPhotos(Array.from(e.target.files))} />
                {photos.length > 0 && (
                  <p className={styles.photoCount}>{photos.length} photo(s) selected</p>
                )}
              </div>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting
                  ? (editingId ? 'Saving...' : 'Submitting...')
                  : (editingId ? 'Save Changes' : 'Submit for Verification')}
              </button>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
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

        {/* Listings Grid */}
        {loading ? (
          <div className={styles.loading}>Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div className={styles.empty}>
            <p>You haven't listed any properties yet.</p>
            <button className={styles.addBtn} onClick={openAddForm}>
              + Add your first listing
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {listings.map(l => {
              const s = STATUS_COLORS[l.status] || STATUS_COLORS.pending;
              return (
                <div key={l.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{l.title}</h3>
                    <span className={styles.statusBadge}
                      style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                  <p className={styles.cardArea}>📍 {l.area_name}</p>
                  <p className={styles.cardPrice}>
                    KES {l.rent_kes.toLocaleString()}/mo
                  </p>
                  <div className={styles.cardActions}>
                    <button className={styles.editBtn}
                      onClick={() => openEditForm(l)}>
                      ✏️ Edit
                    </button>
                    {(l.status === 'verified' || l.status === 'taken') && (
                      <button className={styles.toggleBtn}
                        onClick={() => toggleAvailability(l)}>
                        {l.status === 'taken' ? '✓ Available' : '✗ Taken'}
                      </button>
                    )}
                    <button className={styles.deleteBtn}
                      onClick={() => setDeleteConfirm(l)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
    </div>
  );
}

export default LandlordDashboard;