import { Link } from 'react-router-dom';
import styles from './ListingCard.module.css';

function ListingCard({ listing }) {
  const primaryPhoto = listing.photos?.find(p => p.is_primary) || listing.photos?.[0];
  const bedroomLabel = listing.bedrooms === 0 ? 'Bedsitter' : `${listing.bedrooms} Bedroom`;

  return (
    <Link to={`/listings/${listing.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {primaryPhoto
          ? <img src={primaryPhoto.image} alt={listing.title} />
          : <div className={styles.noImage}>📷 No photos yet</div>
        }
        {listing.landlord_verified && (
          <span className={styles.verifiedBadge}>✓ Verified</span>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.price}>KES {listing.rent_kes.toLocaleString()}<span>/mo</span></div>
        <h3 className={styles.title}>{listing.title}</h3>
        <div className={styles.meta}>
          <span>📍 {listing.area_name}</span>
          <span>🛏 {bedroomLabel}</span>
          {listing.is_furnished && <span>🪑 Furnished</span>}
        </div>
      </div>
    </Link>
  );
}

export default ListingCard;