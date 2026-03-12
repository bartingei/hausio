import { useState, useEffect } from 'react';
import api from '../api/axios';
import ListingCard from '../components/ListingCard';
import styles from './BrowsePage.module.css';

function BrowsePage() {
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({
    area_name: '', bedrooms: '', max_rent: '', min_rent: ''
  });

    const fetchListings = async () => {
    setLoading(true);
    try {
        const params = {};
        if (filters.area_name) params.area_name = filters.area_name;
        if (filters.bedrooms !== '') params.bedrooms = filters.bedrooms;
        if (filters.max_rent)  params.max_rent  = filters.max_rent;
        if (filters.min_rent)  params.min_rent  = filters.min_rent;
        const res = await api.get('/listings/', { params });
        setListings(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => { fetchListings(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Find Your Next Home in Nairobi</h1>
        <p>Every listing verified. Zero fake agents.</p>
      </div>

      <div className={styles.container}>
        <form className={styles.filters} onSubmit={handleFilter}>
          <input
            placeholder="Area (e.g. Rongai)"
            value={filters.area_name}
            onChange={e => setFilters({...filters, area_name: e.target.value})}
          />
          <select
            value={filters.bedrooms}
            onChange={e => setFilters({...filters, bedrooms: e.target.value})}
          >
            <option value="">Any size</option>
            <option value="0">Bedsitter</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
          </select>
          <input
            placeholder="Max rent (KES)"
            type="number"
            value={filters.max_rent}
            onChange={e => setFilters({...filters, max_rent: e.target.value})}
          />
          <button type="submit" className={styles.searchBtn}>Search</button>
        </form>

        {loading ? (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                Finding verified listings...
            </div>
        ) : listings.length === 0 ? (
          <div className={styles.empty}>No listings found. Try different filters.</div>
        ) : (
          <div className={styles.grid}>
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowsePage;