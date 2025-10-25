"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, 
  MapPin, 
  Clock, 
  // DollarSign,
  // User,
  // ChevronLeft,
  Share2,
  Heart,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  pricing: {
    type: string;
    basePrice: number;
    currency: string;
  };
  availability: {
    timezone: string;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
      available: boolean;
    }>;
  };
  estimatedDuration: {
    min: number;
    max: number;
  };
  warranty: {
    hasWarranty: boolean;
    duration: number;
    description: string;
  };
  insurance: {
    covered: boolean;
    coverageAmount: number;
  };
  emergencyService: {
    available: boolean;
    surcharge: number;
    responseTime: string;
  };
  rating: {
    average: number;
    count: number;
  };
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    profile: {
      skills: string[];
      rating: number;
    };
  };
  serviceArea: string[];
  features: string[];
  requirements: string[];
  serviceType: string;
  teamSize: number;
  equipmentProvided: boolean;
  materialsIncluded: boolean;
  servicePackages: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    duration: number;
  }>;
  addOns: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
  }>;
  isActive: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

interface BookingForm {
  date: string;
  time: string;
  duration: number;
  notes: string;
  contactPhone: string;
  contactEmail: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    date: "",
    time: "",
    duration: 0,
    notes: "",
    contactPhone: "",
    contactEmail: ""
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/services/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Service not found");
      }

      const data = await response.json();
      setService(data);
      setBookingForm(prev => ({
        ...prev,
        duration: data.estimatedDuration?.min || 2,
        contactEmail: "", // Will be filled from user session
        contactPhone: "" // Will be filled from user session
      }));
    } catch (error) {
      console.error("Error fetching service:", error);
      setError("Failed to load service details");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/marketplace/services/${params.id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchService();
      fetchReviews();
    }
  }, [params.id, fetchService, fetchReviews]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    try {
      setBookingLoading(true);
      const response = await fetch('/api/marketplace/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service._id,
          providerId: service.provider._id,
          date: bookingForm.date,
          time: bookingForm.time,
          duration: bookingForm.duration,
          notes: bookingForm.notes,
          contactPhone: bookingForm.contactPhone,
          contactEmail: bookingForm.contactEmail,
          totalPrice: service.pricing.basePrice
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      const booking = await response.json();
      router.push(`/marketplace/bookings/${booking.id}`);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };


  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Loading service details..." />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Service Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The service you're looking for doesn't exist."}</p>
        <Link
          href="/marketplace"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/marketplace" className="hover:text-gray-700">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-gray-700">{service.title}</span>
      </nav>

      {/* Service Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-700">{service.title}</h1>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{service.serviceArea?.join(', ') || 'Service area not specified'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service.estimatedDuration?.min || 0}-{service.estimatedDuration?.max || 0} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{service.rating?.average?.toFixed(1) || '0.0'} ({service.rating?.count || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {service.category || 'Service'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Service Images */}
      {service.images && service.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative group overflow-hidden rounded-lg">
              <Image
                src={service.images[selectedImageIndex]}
                alt={service.title}
                width={400}
                height={256}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {service.images.slice(0, 4).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                  selectedImageIndex === index 
                    ? 'ring-2 ring-green-500 shadow-lg scale-105' 
                    : 'hover:shadow-md hover:scale-102'
                }`}
              >
                <Image
                  src={image}
                  alt={`${service.title} ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

        {/* Price and Booking */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-green-600">
              {formatPrice(service.pricing?.basePrice || 0)}
            </div>
            <div className="text-sm text-gray-500">
              {service.pricing?.type === 'hourly' ? 'per hour' : 'per service'}
            </div>
          </div>
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Book Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">{service.description}</p>
          </div>

          {/* Features */}
          {service.features && service.features.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">What&apos;s Included</h2>
              <ul className="space-y-2">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {service.requirements && service.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {service.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-gray-600">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Service Packages */}
          {service.servicePackages && service.servicePackages.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.servicePackages.map((pkg) => (
                  <div key={pkg._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-700 mb-2">{pkg.name || 'Package'}</h3>
                    <p className="text-sm text-gray-600 mb-3">{pkg.description || 'No description available'}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-green-600">{formatPrice(pkg.price || 0)}</span>
                      <span className="text-sm text-gray-500">{pkg.duration || 0} hours</span>
                    </div>
                    <ul className="space-y-1">
                      {pkg.features?.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      )) || []}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {service.addOns && service.addOns.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Available Add-ons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.addOns.map((addon) => (
                  <div key={addon._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-700">{addon.name || 'Add-on'}</h3>
                      <span className="text-lg font-bold text-green-600">{formatPrice(addon.price || 0)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{addon.description || 'No description available'}</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {addon.category || 'General'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Service Type</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                    {service.serviceType?.replace('_', ' ').toUpperCase() || 'NOT SPECIFIED'}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Team Size</h3>
                  <span className="text-gray-600">{service.teamSize || 1} {service.teamSize === 1 ? 'person' : 'people'}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Equipment & Materials</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Equipment {service.equipmentProvided ? 'provided' : 'not provided'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Materials {service.materialsIncluded ? 'included' : 'not included'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Service Areas</h3>
                  <div className="flex flex-wrap gap-1">
                    {service.serviceArea?.map((area, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {area}
                      </span>
                    )) || <span className="text-sm text-gray-500">No service areas specified</span>}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Availability</h3>
                  <span className="text-sm text-gray-600">
                    Timezone: {service.availability?.timezone || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warranty & Protection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Warranty & Protection</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-700 mb-1">Warranty</h3>
                <p className="text-sm text-gray-600">
                  {service.warranty?.hasWarranty 
                    ? `${service.warranty.duration || 0}-day ${service.warranty.description || 'warranty'}`
                    : 'No warranty'
                  }
                </p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-700 mb-1">Insurance</h3>
                <p className="text-sm text-gray-600">
                  {service.insurance?.covered 
                    ? `Covered up to ${formatPrice(service.insurance.coverageAmount || 0)}`
                    : 'Not covered'
                  }
                </p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-700 mb-1">Emergency Service</h3>
                <p className="text-sm text-gray-600">
                  {service.emergencyService?.available 
                    ? `${service.emergencyService.responseTime || 'Not specified'} (+${formatPrice(service.emergencyService.surcharge || 0)})`
                    : 'Not available'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {review.user.avatar ? (
                          <Image
                            src={review.user.avatar}
                            alt={review.user.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {review.user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-700">{review.user.name}</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          <button className="hover:text-gray-700">
                            Helpful ({review.helpful})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Provider</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-gray-600">
                  {service.provider?.firstName?.charAt(0) || 'P'}{service.provider?.lastName?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-700">
                    {service.provider?.firstName || 'Provider'} {service.provider?.lastName || 'Name'}
                  </h4>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(service.provider?.profile?.rating || 0)}
                  <span className="text-sm text-gray-500">
                    ({service.provider?.profile?.rating || 0} rating)
                  </span>
                </div>
              </div>
            </div>
            {service.provider?.profile?.skills && service.provider.profile.skills.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {service.provider.profile.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Safety Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Safety & Trust</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Background verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Identity verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Highly rated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Book Service</h2>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    required
                    value={bookingForm.duration}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    min={30}
                    step={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.contactPhone}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingForm.contactEmail}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes (Optional)
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any special requirements or notes..."
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(service.pricing?.basePrice || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {bookingLoading ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
