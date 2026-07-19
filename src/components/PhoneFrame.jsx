export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-frame__notch" />
      <div className="app-container">
        {children}
      </div>
      <div className="phone-frame__home-indicator" />
    </div>
  );
}
