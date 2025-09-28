import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import PropertyLoadingSkeleton from "./PropertyLoadingSkeleton";
import EnquiryModal from "./EnquiryModal";
import { NetworkError } from "../utils/network-utils";

interface Property {
  _id: string;
  title: string;
  price: number;
  location: {
    city: string;
    state: string;
    address: string;
  };
  images: string[];
  propertyType: string;
  createdAt: string;
  contactInfo: {
    name: string;
  };
}

export default function OLXStyleListings() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );

  useEffect(() => {
    fetchProperties();
    loadFavorites();
  }, []);

  const fetchProperties = async () => {
    try {
      console.log("🏠 Fetching properties...");

      const res = await (window as any).api(
        "properties?status=active&limit=10",
      );
      console.log("📡 Properties response:", {
        status: res.status,
        ok: res.ok,
      });

      if (res.ok) {
        const data = res.json;
        console.log("📊 Properties data:", data);
        const list = Array.isArray(data.data)
          ? data.data
          : data.data?.properties || [];
        if (data.success && list.length > 0) {
          setProperties(list);
          return; // Successfully loaded data, exit early
        }
      }

      // If we get here, either response wasn't ok or no properties found
      console.log("🔄 Using mock properties data");
      loadMockProperties();
    } catch (error: any) {
      console.error(
        "❌ Error fetching properties:",
        error?.message || String(error),
      );

      // Load mock data as fallback
      loadMockProperties();
    } finally {
      setLoading(false);
    }
  };

  const loadMockProperties = () => {
    const mockProperties: Property[] = [
      {
        _id: "mock-1",
        title: "3 BHK Flat for Sale in Rohtak",
        price: 4500000,
        location: { city: "Rohtak", state: "Haryana", address: "Model Town" },
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
        ],
        propertyType: "apartment",
        createdAt: new Date().toISOString(),
        contactInfo: { name: "Rajesh Kumar" },
      },
      {
        _id: "mock-2",
        title: "2 BHK Independent House",
        price: 3200000,
        location: { city: "Rohtak", state: "Haryana", address: "Sector 14" },
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
        ],
        propertyType: "house",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        contactInfo: { name: "Priya Sharma" },
      },
      {
        _id: "mock-3",
        title: "Commercial Shop for Rent",
        price: 25000,
        location: { city: "Rohtak", state: "Haryana", address: "Railway Road" },
        images: [
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
        ],
        propertyType: "commercial",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        contactInfo: { name: "Amit Singh" },
      },
      {
        _id: "mock-4",
        title: "4 BHK Villa with Garden",
        price: 8500000,
        location: { city: "Rohtak", state: "Haryana", address: "Civil Lines" },
        images: [
          "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=400",
        ],
        propertyType: "villa",
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        contactInfo: { name: "Vikash Yadav" },
      },
    ];
    setProperties(mockProperties);
  };

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter((id) => id !== propertyId)
      : [...favorites, propertyId];

    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹ ${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹ ${(price / 100000).toFixed(1)} L`;
    } else if (price >= 1000) {
      return `₹ ${(price / 1000).toFixed(0)}K`;
    }
    return `₹ ${price.toLocaleString()}`;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handlePropertyClick = (property: Property) => {
    navigate(`/properties/${property._id}`);
  };

  if (loading) {
    return <PropertyLoadingSkeleton />;
  }

  return (
    <div className="bg-white">
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Fresh recommendations
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {properties.map((property) => (
            <div
              key={property._id}
              onClick={() => handlePropertyClick(property)}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-98"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img
                  data-wm="1"
                  src={
                    property.coverImageUrl ??
                    property.images?.[0]?.url ??
                    property.images?.[0] ??
                    "/placeholder.png"
                  }
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.png";
                  }}
                />

                {/* Premium Badge */}
                {property.premium && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                    AP Premium
                  </div>
                )}

                {/* Favorite button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(property._id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorites.includes(property._id)
                        ? "fill-red-500 text-red-500"
                        : "text-gray-600"
                    }`}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="p-3">
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatPrice(property.price)}
                </div>

                <h3 className="text-sm text-gray-700 mb-2 line-clamp-2 leading-tight">
                  {property.title}
                </h3>

                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {property.location.city}, {property.location.state}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{getTimeAgo(property.createdAt)}</span>
                  </div>
                  <span className="capitalize text-xs px-2 py-1 bg-gray-100 rounded">
                    {property.propertyType}
                  </span>
                </div>

                {/* Enquiry Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedProperty(property);
                    setEnquiryModalOpen(true);
                  }}
                  data-testid="enquiry-btn"
                  className="w-full bg-[#C70000] hover:bg-[#A60000] text-white text-xs py-2 px-3 rounded-md flex items-center justify-center space-x-1 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span>Enquiry Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">�����</div>
            <p>No properties available</p>
          </div>
        )}

        {/* Load More Button */}
        {properties.length > 0 && (
          <div className="mt-6 text-center">
            <button className="text-[#C70000] font-semibold text-sm hover:underline">
              View all properties
            </button>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      {selectedProperty && (
        <EnquiryModal
          isOpen={enquiryModalOpen}
          onClose={() => {
            setEnquiryModalOpen(false);
            setSelectedProperty(null);
          }}
          propertyId={selectedProperty._id}
          propertyTitle={selectedProperty.title}
          ownerName={selectedProperty.contactInfo?.name || "Property Owner"}
        />
      )}
    </div>
  );
}
