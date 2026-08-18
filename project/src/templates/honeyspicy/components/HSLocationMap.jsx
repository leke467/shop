export default function HSLocationMap({ shop }) {
  return (
    <div className="hs-location">
      <div className="hs-location-map">
        <div className="hs-map-placeholder">
          <div className="hs-map-pin">📍</div>
          <p>{shop?.address || 'Visit us today!'}</p>
        </div>
      </div>
      <div className="hs-location-info">
        <div className="hs-info-item">
          <span className="hs-info-icon">📍</span>
          <div><h4>Address</h4><p>{shop?.address || 'Contact us for our location'}</p></div>
        </div>
        <div className="hs-info-item">
          <span className="hs-info-icon">📞</span>
          <div><h4>Phone</h4><p>{shop?.phone || 'Available on request'}</p></div>
        </div>
        <div className="hs-info-item">
          <span className="hs-info-icon">📧</span>
          <div><h4>Email</h4><p>{shop?.email || 'Contact through the form'}</p></div>
        </div>
        <div className="hs-info-item">
          <span className="hs-info-icon">⏰</span>
          <div><h4>Hours</h4><p>Mon-Sat: 9am - 9pm</p></div>
        </div>
      </div>
    </div>
  )
}
