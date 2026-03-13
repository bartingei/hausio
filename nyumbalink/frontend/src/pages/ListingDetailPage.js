import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import styles from './ListingDetailPage.module.css';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('fake_photos');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}/`)
      .then(res => setListing(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await api.post('/listings/report/', {
        listing: id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSent(true);
    } catch (err) {
      alert('Please log in to report a listing.');
    }
  };

  const whatsappShare = () => {
    const text = `Check out this verified listing on Hausio: ${listing.title} in ${listing.area_name} for KES ${listing.rent_kes.toLocaleString()}/mo — ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div className={styles.loading}>Loading listing...</div>;
  if (!listing) return null;

  const bedroomLabel = listing.bedrooms === 0 ? 'Bedsitter' : `${listing.bedrooms} Bedroom`;
  const hasLocation = listing.location_lat && listing.location_lng;

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Photo Gallery */}
        <div className={styles.gallery}>
          {listing.photos.length > 0 ? (
            <>
              <img
                className={styles.mainPhoto}
                src={listing.photos[activePhoto]?.image}
                alt={listing.title}
              />
              {listing.photos.length > 1 && (
                <div className={styles.thumbs}>
                  {listing.photos.map((p, i) => (
                    <img
                      key={p.id}
                      src={p.image}
                      alt=""
                      className={i === activePhoto ? styles.thumbActive : styles.thumb}
                      onClick={() => setActivePhoto(i)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.noPhoto}>📷 No photos uploaded yet</div>
          )}
        </div>

        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>{listing.title}</h1>
              <p className={styles.area}>📍 {listing.area_name}</p>
            </div>
            <div className={styles.price}>
              KES {listing.rent_kes.toLocaleString()}
              <span>/mo</span>
            </div>
          </div>

          {/* Badges */}
          <div className={styles.badges}>
            <span className={styles.badge}>🛏 {bedroomLabel}</span>
            {listing.is_furnished && <span className={styles.badge}>🪑 Furnished</span>}
            {listing.landlord_verified
              ? <span className={`${styles.badge} ${styles.verified}`}>✓ Verified Landlord</span>
              : <span className={`${styles.badge} ${styles.unverified}`}>⏳ Verification Pending</span>
            }
          </div>

          {/* Description */}
          {listing.description && (
            <div className={styles.section}>
              <h2>About this listing</h2>
              <p>{listing.description}</p>
            </div>
          )}

          {/* Map */}
          {hasLocation && (
            <div className={styles.section}>
              <h2>Location</h2>
              <div className={styles.mapWrapper}>
                <MapContainer
                  center={[parseFloat(listing.location_lat), parseFloat(listing.location_lng)]}
                  zoom={15}
                  style={{ height: '300px', width: '100%', borderRadius: '12px' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[parseFloat(listing.location_lat), parseFloat(listing.location_lng)]}>
                    <Popup>{listing.title}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.whatsappBtn} onClick={whatsappShare}>
              📲 Share on WhatsApp
            </button>
            <button
              className={styles.reportBtn}
              onClick={() => setReportModal(true)}
            >
              🚩 Report Listing
            </button>
          </div>

          {/* Report Modal */}
          {reportModal && (
            <div className={styles.modal}>
              <div className={styles.modalCard}>
                {reportSent ? (
                  <>
                    <h2>✅ Report submitted</h2>
                    <p>Thank you. Our team will review this listing.</p>
                    <button className={styles.btn} onClick={() => setReportModal(false)}>Close</button>
                  </>
                ) : (
                  <>
                    <h2>Report this listing</h2>
                    <p>Help keep Hausio scam-free.</p>
                    <form onSubmit={handleReport} className={styles.reportForm}>
                      <select
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value)}
                      >
                        <option value="fake_photos">Fake photos</option>
                        <option value="already_taken">Already taken</option>
                        <option value="wrong_price">Wrong price</option>
                        <option value="fake_agent">Fake agent</option>
                        <option value="other">Other</option>
                      </select>
                      <textarea
                        placeholder="Additional details (optional)"
                        value={reportDetails}
                        onChange={e => setReportDetails(e.target.value)}
                        rows={3}
                      />
                      <div className={styles.modalActions}>
                        <button type="submit" className={styles.btn}>Submit Report</button>
                        <button type="button" className={styles.cancelBtn} onClick={() => setReportModal(false)}>Cancel</button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingDetailPage;