import { Hexagon, Bug } from 'lucide-react';

export default function FloatingElements() {
  return (
    <div className="floating-elements">
      {/* Left Side Elements */}
      <div
        className="floating-element floating-element--icon"
        style={{ top: '22%', left: '12%', animationDuration: '5s', animationDelay: '0s' }}
      >
        <Hexagon size={48} strokeWidth={1.2} />
      </div>

      <div
        className="floating-element floating-element--text"
        style={{ top: '42%', left: '10%', animationDuration: '6s', animationDelay: '1.5s' }}
      >
        Save the Bees
      </div>

      <div
        className="floating-element floating-element--icon"
        style={{ bottom: '28%', left: '14%', animationDuration: '4.5s', animationDelay: '3s' }}
      >
        <Bug size={36} strokeWidth={1.5} />
      </div>

      {/* Right Side Elements */}
      <div
        className="floating-element floating-element--text"
        style={{ top: '28%', right: '14%', animationDuration: '5.5s', animationDelay: '0.5s' }}
      >
        AI for Apiculture
      </div>

      <div
        className="floating-element floating-element--icon"
        style={{ top: '58%', right: '16%', animationDuration: '4s', animationDelay: '2s' }}
      >
        <Hexagon size={42} strokeWidth={1.2} />
      </div>

      <div
        className="floating-element floating-element--text"
        style={{ bottom: '22%', right: '12%', animationDuration: '6.5s', animationDelay: '4s' }}
      >
        62% Colony Loss
      </div>

      <div
        className="floating-element floating-element--icon"
        style={{ top: '18%', right: '28%', animationDuration: '3.5s', animationDelay: '1s' }}
      >
        <Bug size={28} strokeWidth={1.5} />
      </div>
    </div>
  );
}
