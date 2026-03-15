import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './ListingDetailPage.module.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.starInput}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          className={s <= (hover || value) ? styles.starOn : styles.starOff}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >★</span>
      ))}
    </div>
  );
}

function SafetyBar({ label, value, max = 5, invert = false }) {
  const pct = (value / max) * 100;
  const color = invert
    ? value <= 2 ? '#1E7C47' : value === 3 ? '#F59E0B' : '#C85A1A'
    : value >= 4 ? '#1E7C47' : value === 3 ? '#F59E0B' : '#C85A1A';
  return (
    <div className={styles.safetyBarRow}>
      <span className={styles.safetyBarLabel}>{label}</span>
      <div className={styles.safetyBarTrack}>
        <div className={styles.safetyBarFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.safetyBarVal}>{value}/5</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [safety, setSafety]         = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', details: '' });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchListing();
    trackRecentlyViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await api.get(`/listings/${id}/`);
      setListing(res.data);
      fetchReviews();
      fetchSafety(res.data.area_name);
      if (user) fetchBookmarkStatus();
    } catch {
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/listings/${id}/reviews/`);
      setReviews(res.data);
    } catch {}
  };

  const fetchSafety = async (area) => {
    try {
      const res = await api.get('/listings/safety/', { params: { area } });
      setSafety(res.data);
    } catch {}
  };

  const fetchBookmarkStatus = async () => {
    try {
      const res = await api.get(`/listings/${id}/bookmark-status/`);
      setBookmarked(res.data.bookmarked);
    } catch {}
  };

  const trackRecentlyViewed = () => {
    const rv = JSON.parse(localStorage.getItem('hausio_recent') || '[]');
    const updated = [id, ...rv.filter(x => x !== id)].slice(0, 10);
    localStorage.setItem('hausio_recent', JSON.stringify(updated));
  };

  const handleBookmark = async () => {
    if (!user) return alert('Log in to save listings');
    try {
      const res = await api.post(`/listings/${id}/bookmark/`);
      setBookmarked(res.data.bookmarked);
    } catch {}
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return setReviewError('Please select a rating');
    if (!reviewForm.comment.trim()) return setReviewError('Please write a comment');
    setSubmittingReview(true);
    setReviewError('');
    try {
      await api.post(`/listings/${id}/reviews/`, reviewForm);
      setReviewForm({ rating: 0, comment: '' });
      fetchReviews();
      fetchListing();
    } catch (err) {
      setReviewError(err.response?.data?.detail || err.response?.data?.[0] || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await api.post('/listings/report/', { listing: id, ...reportForm });
      setReportSubmitted(true);
    } catch {}
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi, I found your listing on Hausio:\n*${listing.title}*\nKES ${listing.rent_kes?.toLocaleString()}/mo — ${listing.area_name}\n\nhttps://hausio.vercel.app/listings/${id}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) return (
    <div className={styles.loadingPage}>
      <div className={styles.spinner} />
    </div>
  );

  if (!listing) return null;

  const photos = listing.photos || [];
  const hasMap = listing.location_lat && listing.location_lng;
  const avgRating = listing.avg_rating;
  const reviewCount = listing.review_count;

  const statusConfig = {
    verified:  { label: '✓ Verified',           color: '#1E7C47', bg: '#D4EFDF' },
    pending:   { label: '⏳ Verification Pending', color: '#B45309', bg: '#FEF3C7' },
    rejected:  { label: '✗ Rejected',             color: '#9B2335', bg: '#FADBD8' },
    reserved:  { label: '🔒 Reserved',             color: '#1A56A0', bg: '#DBEAFE' },
    taken:     { label: '✗ Taken',                 color: '#666',    bg: '#F3F4F6' },
  };
  const status = statusConfig[listing.status] || statusConfig.pending;

  return (
    <div className={styles.page}>
      {/* Back button */}
      <div className={styles.backBar}>
        <button className={styles.backBtn} onClick={() => navigate('/browse')}>
          ← Back to listings
        </button>
        <div className={styles.backActions}>
          <button
            className={`${styles.actionBtn} ${bookmarked ? styles.actionBtnActive : ''}`}
            onClick={handleBookmark}
          >
            {bookmarked ? '♥ Saved' : '♡ Save'}
          </button>
          <button className={styles.actionBtn} onClick={() => setShowReportModal(true)}>
            🚩 Report
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── LEFT COLUMN ── */}
        <div className={styles.leftCol}>

          {/* Photo gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainPhoto}>
              {photos.length > 0
                ? <img src={photos[activePhoto]?.image} alt={listing.title} />
                : <div className={styles.noPhoto}>📷 No photos uploaded</div>
              }
              {photos.length > 1 && (
                <>
                  <button
                    className={`${styles.galleryNav} ${styles.galleryPrev}`}
                    onClick={() => setActivePhoto(p => Math.max(0, p - 1))}
                    disabled={activePhoto === 0}
                  >‹</button>
                  <button
                    className={`${styles.galleryNav} ${styles.galleryNext}`}
                    onClick={() => setActivePhoto(p => Math.min(photos.length - 1, p + 1))}
                    disabled={activePhoto === photos.length - 1}
                  >›</button>
                  <div className={styles.galleryCount}>{activePhoto + 1} / {photos.length}</div>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className={styles.thumbStrip}>
                {photos.map((p, i) => (
                  <div
                    key={p.id}
                    className={`${styles.thumb} ${i === activePhoto ? styles.thumbActive : ''}`}
                    onClick={() => setActivePhoto(i)}
                  >
                    <img src={p.image} alt={`Photo ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          {hasMap && (
            <div className={styles.mapSection}>
              <h3 className={styles.sectionTitle}>📍 Location</h3>
              <div className={styles.mapWrap}>
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
              <a
                href={`https://www.google.com/maps?q=${listing.location_lat},${listing.location_lng}`}
                target="_blank"
                rel="noreferrer"
                className={styles.mapsLink}
              >
                Open in Google Maps →
              </a>
            </div>
          )}

          {/* Neighbourhood Safety */}
          {safety && (
            <div className={styles.safetySection}>
              <h3 className={styles.sectionTitle}>🛡️ Neighbourhood Safety — {safety.area_name}</h3>
              <div className={styles.safetyScore}>
                <span className={styles.safetyNum}>{safety.safety_score}</span>
                <span className={styles.safetyMax}>/5</span>
                <span className={styles.safetyLabel}>Overall safety score</span>
              </div>
              <SafetyBar label="Safety"    value={safety.safety_score} />
              <SafetyBar label="Lighting"  value={safety.lighting} />
              <SafetyBar label="Transport" value={safety.transport} />
              <SafetyBar label="Noise"     value={safety.noise_level} invert />
              {safety.notes && <p className={styles.safetyNotes}>{safety.notes}</p>}
            </div>
          )}

          {/* Reviews */}
          <div className={styles.reviewsSection}>
            <div className={styles.reviewsHeader}>
              <h3 className={styles.sectionTitle}>
                ★ Reviews
                {avgRating && <span className={styles.avgRating}>{avgRating} ({reviewCount})</span>}
              </h3>
            </div>

            {/* Review form — tenants only */}
            {user?.role === 'tenant' && (
              <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
                <h4>Leave a review</h4>
                <StarInput value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
                <textarea
                  placeholder="Share your experience with this listing..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4}
                />
                {reviewError && <div className={styles.reviewError}>{reviewError}</div>}
                <button type="submit" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <div className={styles.noReviews}>No reviews yet. Be the first to review this listing.</div>
            ) : (
              <div className={styles.reviewsList}>
                {reviews.map(r => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewAvatar}>{r.tenant_email[0].toUpperCase()}</div>
                      <div>
                        <div className={styles.reviewEmail}>{r.tenant_email}</div>
                        <div className={styles.reviewStars}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={s <= r.rating ? styles.starOn : styles.starOff}>★</span>
                          ))}
                          <span className={styles.reviewDate}>
                            {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className={styles.reviewComment}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className={styles.rightCol}>
          <div className={styles.infoCard}>
            {/* Status */}
            <div className={styles.statusBadge} style={{ color: status.color, background: status.bg }}>
              {status.label}
            </div>

            {/* Title & Price */}
            <h1 className={styles.title}>{listing.title}</h1>
            <div className={styles.price}>
              KES {listing.rent_kes?.toLocaleString()}
              <span>/month</span>
            </div>

            {/* Rating summary */}
            {avgRating && (
              <div className={styles.ratingRow}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={s <= Math.round(avgRating) ? styles.starOn : styles.starOff}>★</span>
                ))}
                <span className={styles.ratingText}>{avgRating} out of 5 · {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Quick facts */}
            <div className={styles.facts}>
              <div className={styles.fact}>
                <span className={styles.factIcon}>🛏</span>
                <span>{listing.bedrooms === 0 ? 'Bedsitter' : `${listing.bedrooms} Bedroom${listing.bedrooms > 1 ? 's' : ''}`}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factIcon}>🪑</span>
                <span>{listing.is_furnished ? 'Furnished' : 'Unfurnished'}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factIcon}>📍</span>
                <span>{listing.area_name}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factIcon}>👤</span>
                <span>
                  {listing.landlord_email}
                  {listing.landlord_verified && <span className={styles.verifiedTag}> ✓ ID Verified</span>}
                </span>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className={styles.descSection}>
                <h4>About this listing</h4>
                <p>{listing.description}</p>
              </div>
            )}

            {/* CTA */}
            <button className={styles.whatsappBtn} onClick={handleWhatsApp}>
              <span>💬</span> Contact on WhatsApp
            </button>

            {/* Share */}
            <button
              className={styles.shareBtn}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? '✓ Link copied!' : '🔗 Copy listing link'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Report Modal ── */}
      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {reportSubmitted ? (
              <div className={styles.reportSuccess}>
                <span>✓</span>
                <h3>Report submitted</h3>
                <p>Our team will review this listing. Thank you for helping keep Hausio safe.</p>
                <button onClick={() => { setShowReportModal(false); setReportSubmitted(false); }}>Close</button>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <h3>Report this listing</h3>
                  <button onClick={() => setShowReportModal(false)}>✕</button>
                </div>
                <form onSubmit={handleReport}>
                  <div className={styles.formGroup}>
                    <label>Reason</label>
                    <select
                      value={reportForm.reason}
                      onChange={e => setReportForm(f => ({ ...f, reason: e.target.value }))}
                      required
                    >
                      <option value="">Select a reason</option>
                      <option value="fake_photos">Fake Photos</option>
                      <option value="already_taken">Already Taken</option>
                      <option value="wrong_price">Wrong Price</option>
                      <option value="fake_agent">Fake Agent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Details (optional)</label>
                    <textarea
                      rows={4}
                      placeholder="Tell us more about the issue..."
                      value={reportForm.details}
                      onChange={e => setReportForm(f => ({ ...f, details: e.target.value }))}
                    />
                  </div>
                  <button type="submit" className={styles.reportBtn}>Submit Report</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
