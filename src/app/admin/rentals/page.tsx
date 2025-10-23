"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import EmptyState from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td, TableEmptyRow } from "@/components/ui/table";
import { 
  Home, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  Users
} from "lucide-react";

interface Rental {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  dailyRate?: string;
  location?: string;
  rating?: string;
}

export default function RentalsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rentals");
      const data = await response.json();
      setRentals(data);
    } catch (error) {
      console.error("Error fetching rentals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <Loading text="Loading rentals" fullScreen />;
  }

  if (!session) {
    return null;
  }

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = rental.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rental.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || rental.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <a href="/admin" className="text-gray-500 hover:text-gray-700">
                ← Back to Admin
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-700 flex items-center">
                  <Home className="w-8 h-8 mr-3 text-orange-600" />
                  Rentals Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage rental items, bookings, and availability
                </p>
              </div>
            </div>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Rental
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Home className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Rentals</p>
                <p className="text-2xl font-bold text-gray-700">{rentals.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-700">89</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-700">$8,945</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Providers</p>
                <p className="text-2xl font-bold text-gray-700">23</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search rentals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Categories</option>
                <option value="equipment">Equipment</option>
                <option value="tools">Tools</option>
                <option value="vehicles">Vehicles</option>
                <option value="machinery">Machinery</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </Card>

        {/* Rentals Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Rental Item</Th>
                <Th>Category</Th>
                <Th>Daily Rate</Th>
                <Th>Location</Th>
                <Th>Rating</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {filteredRentals.length === 0 ? (
                <TableEmptyRow colSpan={7}>
                  <EmptyState
                    title="No rentals found"
                    description="Try adjusting your search or filters."
                    icon={<Home className="w-7 h-7 text-gray-400" />}
                  />
                </TableEmptyRow>
              ) : (
                filteredRentals.map((rental, index) => (
                  <Tr key={index}>
                    <Td>
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Home className="w-5 h-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-700">
                            {rental.name || "Sample Rental"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rental.description || "Rental description"}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        {rental.category || "Equipment"}
                      </span>
                    </Td>
                    <Td>${rental.dailyRate || "45.00"}/day</Td>
                    <Td>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        {rental.location || "Manila, PH"}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-700">{rental.rating || "4.7"}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                    </Td>
                    <Td>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
