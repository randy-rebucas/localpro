"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  Heart,
  Share2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  MessageCircle,
  BookOpen,
  Calendar
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";

interface Rental {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'equipment' | 'vehicle' | 'space' | 'tool';
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  price: number;
  priceUnit: 'hour' | 'day' | 'week' | 'month';
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  features: string[];
  specifications: {
    brand?: string;
    model?: string;
    year?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    capacity?: string;
    dimensions?: string;
    weight?: string;
  };
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
    phone?: string;
    email?: string;
  };
  availability: {
    startDate: string;
    endDate: string;
    isAvailable: boolean;
  };
  rating: number;
  reviewCount: number;
  viewsCount: number;
  isFeatured: boolean;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

const getStatusColor = (status: Rental['status']) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'rented': return 'bg-blue-100 text-blue-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    case 'unavailable': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getConditionColor = (condition: Rental['specifications']['condition']) => {
  switch (condition) {
    case 'excellent': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'fair': return 'bg-yellow-100 text-yellow-800';
    case 'poor': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startDate: "",
    endDate: "",
    notes: "",
    contactPhone: "",
    contactEmail: ""
  });

  useEffect(() => {
    const fetchRental = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rentals/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Rental not found');
        }

        const data = await response.json();
        setRental(data);
      } catch (error) {
        console.error('Error fetching rental:', error);
        setError('Failed to load rental details');
        // Fallback to mock data
        setRental({
          id: params.id as string,
          name: 'Professional Excavator - CAT 320',
          description: 'Heavy-duty excavator perfect for construction projects. Well-maintained and ready for immediate use. This machine has been professionally serviced and is in excellent working condition.',
          category: 'Construction Equipment',
          type: 'equipment',
          status: 'available',
          price: 150,
          priceUnit: 'day',
          location: {
            address: '123 Construction Way',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          },
          images: ['/api/placeholder/800/600', '/api/placeholder/800/600', '/api/placeholder/800/600'],
          features: ['Air Conditioning', 'GPS Tracking', 'Safety Equipment', 'Fuel Efficient', '4WD', 'Bluetooth'],
          specifications: {
            brand: 'Caterpillar',
            model: '320',
            year: 2020,
            condition: 'excellent',
            capacity: '20 tons',
            dimensions: '25ft x 8ft x 10ft',
            weight: '20,000 lbs'
          },
          owner: {
            id: '1',
            name: 'Heavy Equipment Rentals',
            rating: 4.8,
            reviewCount: 124,
            verified: true,
            phone: '+1 (555) 123-4567',
            email: 'contact@heavyequipment.com'
          },
          availability: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isAvailable: true
          },
          rating: 4.8,
          reviewCount: 24,
          viewsCount: 156,
          isFeatured: true,
          isFavorited: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRental();
    }
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/rentals/${params.id}/edit`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this rental?')) {
      try {
        const response = await fetch(`/api/rentals/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/rentals');
        }
      } catch (error) {
        console.error('Error deleting rental:', error);
      }
    }
  };

  const handleToggleFavorite = async () => {
    try {
      // Implement favorite toggle
      console.log('Toggle favorite for rental:', params.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBookRental = async () => {
    if (!bookingForm.startDate || !bookingForm.endDate) {
      alert('Please select start and end dates');
      return;
    }

    try {
      const response = await fetch(`/api/rentals/${params.id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingForm),
      });

      if (response.ok) {
        alert('Booking request submitted successfully!');
        setShowBookingForm(false);
      } else {
        alert('Failed to submit booking request');
      }
    } catch (error) {
      console.error('Error booking rental:', error);
      alert('Failed to submit booking request');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Rental not found</h3>
        <p className="text-gray-600 mb-4">The rental you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => router.push('/rentals')}>
          Back to Rentals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rentals', href: '/rentals' },
          { label: rental.name, href: `/rentals/${rental.id}` }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{rental.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                {rental.status}
              </span>
              {rental.isFeatured && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 inline mr-1" />
                  Featured
                </span>
              )}
            </div>
            <p className="text-gray-600">Listed by {rental.owner.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleFavorite}
            className={`flex items-center gap-2 ${rental.isFavorited ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-4 h-4 ${rental.isFavorited ? 'fill-current' : ''}`} />
            {rental.isFavorited ? 'Favorited' : 'Favorite'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rental Images */}
          {rental.images.length > 0 && (
            <Card className="overflow-hidden">
              <div className="relative">
                <Image
                  src={rental.images[selectedImageIndex]}
                  alt={rental.name}
                  width={800}
                  height={256}
                  className="w-full h-64 object-cover"
                />
                {rental.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {rental.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {rental.images.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {rental.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                          index === selectedImageIndex ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${rental.name} ${index + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Rental Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{rental.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {rental.category}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Type</h3>
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {rental.type}
                  </span>
                </div>
              </div>

              {rental.features.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {rental.features.map((feature) => (
                      <span
                        key={feature}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{rental.location.address}, {rental.location.city}, {rental.location.state} {rental.location.zipCode}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Specifications */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rental.specifications.brand && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Brand</h3>
                  <p className="text-gray-600">{rental.specifications.brand}</p>
                </div>
              )}
              {rental.specifications.model && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Model</h3>
                  <p className="text-gray-600">{rental.specifications.model}</p>
                </div>
              )}
              {rental.specifications.year && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Year</h3>
                  <p className="text-gray-600">{rental.specifications.year}</p>
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Condition</h3>
                <span className={`px-2 py-1 rounded-full text-sm ${getConditionColor(rental.specifications.condition)}`}>
                  {rental.specifications.condition}
                </span>
              </div>
              {rental.specifications.capacity && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Capacity</h3>
                  <p className="text-gray-600">{rental.specifications.capacity}</p>
                </div>
              )}
              {rental.specifications.dimensions && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Dimensions</h3>
                  <p className="text-gray-600">{rental.specifications.dimensions}</p>
                </div>
              )}
              {rental.specifications.weight && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Weight</h3>
                  <p className="text-gray-600">{rental.specifications.weight}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Reviews */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-2xl font-bold">{rental.rating}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">{rental.reviewCount} reviews</p>
                <p className="text-sm text-gray-500">Based on {rental.viewsCount} views</p>
              </div>
            </div>
            <p className="text-gray-600">No reviews yet. Be the first to review this rental!</p>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing & Booking */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Booking</h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  ${rental.price}
                  <span className="text-lg text-gray-500">/{rental.priceUnit}</span>
                </div>
                <p className="text-sm text-gray-600">Starting price</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available From</span>
                  <span className="font-medium">
                    {new Date(rental.availability.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available Until</span>
                  <span className="font-medium">
                    {new Date(rental.availability.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {rental.status === 'available' ? (
                <Button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
              ) : (
                <Button disabled className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Not Available
                </Button>
              )}
            </div>
          </Card>

          {/* Owner Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium">
                  {rental.owner.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rental.owner.name}</span>
                  {rental.owner.verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{rental.owner.rating}</span>
                  <span className="text-sm text-gray-500">({rental.owner.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {rental.owner.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open(`tel:${rental.owner.phone}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {rental.owner.phone}
                </Button>
              )}
              {rental.owner.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${rental.owner.email}`)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Similar
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book This Rental</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.startDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.endDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.contactPhone}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="Your phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={bookingForm.contactEmail}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="Your email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requirements or notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBookRental}
                  className="flex-1"
                >
                  Submit Booking
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
