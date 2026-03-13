import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './AdminDashboard.module.css';
import ConfirmDialog from '../components/ConfirmDialog';


function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [dialog, setDialog] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user || user.role !== 'admin') { 
      navigate('/');
      return; 
    }
    fetchListings();
  }, [user, navigate]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/listings/all/', { params: { status: filter } });
      setListings(res.data);
      setExpanded(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchListings();
  }, [filter]);

  const handleApproval = (id, status) => {
    const configs = {
      verified: {
        title: 'Approve Listing?',
        message: 'This listing will be visible to all tenants on Hausio.',
        confirmLabel: '✓ Approve',
        confirmColor: '#1E7C47',
      },
      rejected: {
        title: 'Reject Listing?',
        message: 'This listing will be hidden from tenants and marked as rejected.',
        confirmLabel: '✗ Reject',
        confirmColor: '#9B2335',
      },
      pending: {
        title: 'Revoke Approval?',
        message: 'This listing will be removed from public view and moved back to pending.',
        confirmLabel: '↩ Revoke',
        confirmColor: '#C0622A',
      },
    };

    const config = configs[status];
    setDialog({
      ...config,
      onConfirm: async () => {
        try {
          await api.patch(`/listings/${id}/approve/`, { status });
          setDialog(null);
          fetchListings();
        } catch (err) {
          setDialog(null);
          alert('Action failed.');
        }
      }
    });
  };

  const handleDelete = (id, title) => {
    setDialog({
      title: 'Delete Listing?',
      message: `This will permanently remove "${title}". This cannot be undone.`,
      confirmLabel: '🗑️ Delete',
      confirmColor: '#9B2335',
      onConfirm: async () => {
        try {
          await api.delete(`/listings/${id}/admin-delete/`);
          setDialog(null);
          fetchListings();
        } catch (err) {
          setDialog(null);
          alert('Failed to delete listing.');
        }
      }
    });
  };

  const verifyLandlord = async (email) => {
    try {
      await api.post('/accounts/verify-landlord/', { email });
      fetchListings();
    } catch (err) {
      alert('Failed to verify landlord.');
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => prev === id ? null : id);
  };

  const TABS = ['pending', 'verified', 'rejected'];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>Admin Dashboard</h1>
          <p>Review, approve and manage all listings</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(s => (
            <button
              key={s}
              className={filter === s ? styles.tabActive : styles.tab}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Loading listings...
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.empty}>No {filter} listings.</div>
        ) : (
          <div className={styles.list}>
            {listings.map(l => (
              <div key={l.id} className={styles.card}>

                {/* ── Card Header (always visible) ── */}
                <div
                  className={styles.cardHeader}
                  onClick={() => toggleExpand(l.id)}
                >
                  <div className={styles.cardSummary}>
                    <h3>{l.title}</h3>
                    <div className={styles.cardMeta}>
                      <span>📍 {l.area_name}</span>
                      <span>KES {Number(l.rent_kes).toLocaleString()}/mo</span>
                      <span>🛏 {l.bedrooms === 0 ? 'Bedsitter' : `${l.bedrooms} bed`}</span>
                      {l.is_furnished && <span>🪑 Furnished</span>}
                    </div>
                    <div className={styles.landlordRow}>
                      <span className={styles.landlordEmail}>👤 {l.landlord_email}</span>
                      {l.landlord_verified
                        ? <span className={styles.verifiedTag}>✓ ID Verified</span>
                        : <span className={styles.pendingTag}>⏳ ID Pending</span>
                      }
                    </div>
                  </div>
                  <div className={styles.expandIcon}>
                    {expanded === l.id ? '▲' : '▼'}
                  </div>
                </div>

                {/* ── Expanded Detail ── */}
                {expanded === l.id && (
                  <div className={styles.expanded}>

                    {/* Photos */}
                    {l.photos && l.photos.length > 0 ? (
                      <div className={styles.photoStrip}>
                        {l.photos.map((p, i) => (
                          <img
                            key={p.id || i}
                            src={p.image}
                            alt={`Listing ${i + 1}`}
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
                          📍 View on Google Maps
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className={styles.actionBar}>
                      {/* Landlord verification */}
                      {!l.landlord_verified && (
                        <button
                          className={styles.verifyLandlordBtn}
                          onClick={() => verifyLandlord(l.landlord_email)}
                        >
                          ✓ Verify Landlord ID
                        </button>
                      )}

                      {/* Listing status actions */}
                      {filter === 'pending' && (
                        <>
                          <button className={styles.approveBtn}
                            onClick={() => handleApproval(l.id, 'verified')}>
                            ✓ Approve Listing
                          </button>
                          <button className={styles.rejectBtn}
                            onClick={() => handleApproval(l.id, 'rejected')}>
                            ✗ Reject Listing
                          </button>
                        </>
                      )}

                      {filter === 'verified' && (
                        <button className={styles.revokeBtn}
                          onClick={() => handleApproval(l.id, 'pending')}>
                          ↩ Revoke Approval
                        </button>
                      )}

                      {filter === 'rejected' && (
                        <button className={styles.approveBtn}
                          onClick={() => handleApproval(l.id, 'verified')}>
                          ✓ Approve Anyway
                        </button>
                      )}

                      {/* Always available */}
                      <button className={styles.deleteBtn}
                        onClick={() => handleDelete(l.id, l.title)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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

export default AdminDashboard;
