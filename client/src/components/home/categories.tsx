import { useLocation } from "wouter";

const Categories: React.FC = () => {
  const [_, setLocation] = useLocation();

  return (
    <div className="flex justify-between mb-6">
      <div 
        className="flex flex-col items-center w-16 cursor-pointer"
        onClick={() => setLocation('/hotel-booking')}
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M2 20h20" />
            <path d="M5 4h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
            <path d="M6 10v4" />
            <path d="M18 10v4" />
            <path d="M10 2v2" />
            <path d="M14 2v2" />
          </svg>
        </div>
        <span className="text-xs text-center">Hotels</span>
      </div>
      <div 
        className="flex flex-col items-center w-16 cursor-pointer"
        onClick={() => setLocation('/transport-booking')}
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M8 6v6" />
            <path d="M15 6v6" />
            <path d="M2 12h19.6" />
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5c-.2-.6-.8-1-1.4-1H5c-.6 0-1.2.4-1.4 1l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1 .8 2.8.8 2.8h3" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
          </svg>
        </div>
        <span className="text-xs text-center">Bus Tickets</span>
      </div>
      <div 
        className="flex flex-col items-center w-16 cursor-pointer"
        onClick={() => setLocation('/transport-booking')}
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
            <rect width="20" height="8" x="2" y="11" rx="2" />
            <path d="M4 19h16" />
            <path d="M9 3v10" />
            <path d="M9 19v2" />
            <path d="M15 19v2" />
            <path d="M15 3v10" />
          </svg>
        </div>
        <span className="text-xs text-center">Train Tickets</span>
      </div>
      <div 
        className="flex flex-col items-center w-16 cursor-pointer"
        onClick={() => setLocation('/search')}
      >
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#eab308"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>
        <span className="text-xs text-center">Explore</span>
      </div>
    </div>
  );
};

export default Categories;
