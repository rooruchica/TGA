import { PlaceCategory } from "@/lib/geoapify";

interface POICategoriesProps {
  onCategorySelect: (category: PlaceCategory) => void;
}

const POICategories: React.FC<POICategoriesProps> = ({ onCategorySelect }) => {
  return (
    <div className="p-4 pb-16">
      <p className="text-gray-600 mb-4">Select a category to search for points of interest</p>
      
      <div className="grid grid-cols-3 gap-4">
        <button 
          className="flex flex-col items-center"
          onClick={() => onCategorySelect(PlaceCategory.MEDICAL)}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-gray-600"
            >
              <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
              <circle cx="17" cy="7" r="5" />
            </svg>
          </div>
          <span className="text-xs text-center">Medical Stores</span>
        </button>
        
        <button 
          className="flex flex-col items-center"
          onClick={() => onCategorySelect(PlaceCategory.RESTAURANT)}
        >
          <div className="w-12 h-12 bg-[#DC143C] bg-opacity-10 rounded-full flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC143C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M3 15v2a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2" />
              <path d="M4 11h16" />
              <path d="M10 11 9 4c0-.5.5-1 1-1h4c.5 0 1 .5 1 1l-1 7" />
            </svg>
          </div>
          <span className="text-xs text-center text-[#DC143C]">Restaurants</span>
        </button>
        
        <button 
          className="flex flex-col items-center"
          onClick={() => onCategorySelect(PlaceCategory.HOTEL)}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-gray-600"
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
        </button>
        
        <button 
          className="flex flex-col items-center"
          onClick={() => onCategorySelect(PlaceCategory.ATM)}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-gray-600"
            >
              <rect width="20" height="12" x="2" y="6" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          </div>
          <span className="text-xs text-center">ATMs</span>
        </button>
        
        <button 
          className="flex flex-col items-center"
          onClick={() => onCategorySelect(PlaceCategory.SHOPPING)}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-gray-600"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <span className="text-xs text-center">Shopping</span>
        </button>
        
        <button 
          className="flex flex-col items-center"
          onClick={() => onCategorySelect(PlaceCategory.ATTRACTION)}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-gray-600"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <span className="text-xs text-center">Attractions</span>
        </button>
      </div>
    </div>
  );
};

export default POICategories;
