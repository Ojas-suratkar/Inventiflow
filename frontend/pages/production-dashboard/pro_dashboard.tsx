import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Bell, MessageCircle } from "lucide-react";

const ProductionManagerDashboard = () => {
  const router = useRouter();
  const [managerDetails, setManagerDetails] = useState(null);
  const [placedOrders, setPlacedOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    packaging: "",
    minPrice: "",
    maxPrice: "",
    minQty: "",
    maxQty: "",
  });

  // Authenticate and redirect
  useEffect(() => {
    const checkAuth = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        router.replace("/login");
        return;
      }

      const userId = session.session.user.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, company_name, company_location, role")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.error("Unauthorized or no profile found.");
        router.replace("/login");
      } else {
        setManagerDetails(data);
        fetchPlacedOrders(data.id);
        fetchInventory();
      }
    };

    checkAuth();
  }, [router]);

  

  // Fetch placed orders for the production manager
  const fetchPlacedOrders = async (managerId) => {
    const { data, error } = await supabase
      .from("war_orders")
      .select("product_id, packaging_id, quantity, base_price, total_price")
      .eq("manager_id", managerId);

    if (error) {
      console.error("Error fetching placed orders:", error);
    } else {
      setPlacedOrders(data || []);
    }
  };

  // Fetch inventory data (raw materials)
  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("warehouse_inventory")
      .select("product_id, quantity, base_price, total_price");

    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setInventory(data || []);
    }
  };

  // Apply Filters for Inventory
  const filteredInventory = inventory.filter((item) => {
    return (
      (!filters.name || item.raw_material.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.packaging || item.packaging_id.toLowerCase().includes(filters.packaging.toLowerCase())) &&
      (!filters.minPrice || item.unit_price >= parseFloat(filters.minPrice)) &&
      (!filters.maxPrice || item.unit_price <= parseFloat(filters.maxPrice)) &&
      (!filters.minQty || item.quantity >= parseInt(filters.minQty)) &&
      (!filters.maxQty || item.quantity <= parseInt(filters.maxQty))
    );
  });

  const handlePlaceOrder = () => {
    // Implement logic for placing a new order (e.g., redirect to another page)
    alert("Navigating to Place an Order page...");
  };

  const handleReceivedOrders = () => {
    // Implement logic for received orders (e.g., navigate to received orders page)
    alert("Navigating to Received Orders page...");
  };

  const handleAnalytics = () => {
    // Implement logic for analytics page
    alert("Navigating to Analytics page...");
  };

  const handleInventory = () => {
    // Implement logic for showing raw material inventory page
    alert("Navigating to Raw Material Inventory page...");
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-6 flex flex-col justify-between">
        {managerDetails && (
          <Card className="bg-gray-800 p-4 mb-8 text-center">
            <h2 className="text-xl font-bold text-white">{managerDetails.name}</h2>
            <p className="text-gray-400 text-sm">{managerDetails.role}</p>
            <p className="text-gray-400 text-sm">{managerDetails.email}</p>
            <p className="text-gray-400 text-sm">{managerDetails.company_name}</p>
            <p className="text-gray-400 text-sm">{managerDetails.company_location}</p>
          </Card>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Production Manager Dashboard</h1>
        </div>

        {/* Floating Widgets */}
        <div className="fixed top-4 right-4 z-50">
          <div className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg cursor-pointer transition duration-300 ease-in-out">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="fixed bottom-4 left-4 z-50">
          <div className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition duration-300 ease-in-out">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-4 bg-gray-800 text-center cursor-pointer hover:bg-gray-700" onClick={handlePlaceOrder}>
            <h2 className="text-xl font-bold">Place Orders</h2>
          </Card>
          <Card className="p-4 bg-gray-800 text-center cursor-pointer hover:bg-gray-700" onClick={() => router.push("/production-dashboard/pro_rec_orders")}>
            <h2 className="text-xl font-bold">Received Orders</h2>
          </Card>
          <Card className="p-4 bg-gray-800 text-center cursor-pointer hover:bg-gray-700" onClick={handleAnalytics}>
            <h2 className="text-xl font-bold">Analytics</h2>
          </Card>
          <Card className="p-4 bg-gray-800 text-center cursor-pointer hover:bg-gray-700" onClick={handleInventory}>
            <h2 className="text-xl font-bold">Inventory</h2>
          </Card>
        </div>

        {/* Filter Button with Popover */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button className="bg-gray-800 text-white hover:bg-gray-700 mb-4 flex items-center">
              Filter By
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </Popover.Trigger>
          <Popover.Content className="p-6 bg-gray-900 rounded-lg shadow-lg z-50 w-80">
            <h3 className="text-lg font-bold mb-4">Filter Inventory</h3>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Raw Material Name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                className="bg-gray-800 text-white"
              />
              <Input
                type="text"
                placeholder="Packaging Type"
                value={filters.packaging}
                onChange={(e) => setFilters({ ...filters, packaging: e.target.value })}
                className="bg-gray-800 text-white"
              />
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="bg-gray-800 text-white"
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="bg-gray-800 text-white"
              />
              <Input
                type="number"
                placeholder="Min Quantity"
                value={filters.minQty}
                onChange={(e) => setFilters({ ...filters, minQty: e.target.value })}
                className="bg-gray-800 text-white"
              />
              <Input
                type="number"
                placeholder="Max Quantity"
                value={filters.maxQty}
                onChange={(e) => setFilters({ ...filters, maxQty: e.target.value })}
                className="bg-gray-800 text-white"
              />
            </div>
          </Popover.Content>
        </Popover.Root>

        {/* Inventory Table */}
        <Card className="p-6 bg-gray-800 mt-4">
          <h2 className="text-xl font-bold mb-4">Inventory</h2>
          <div className="overflow-auto max-h-72 border border-gray-700">
            <table className="min-w-full border-collapse bg-gray-800 text-center border border-gray-700">
              <thead>
                <tr>
                  <th className="border p-4">Raw Material</th>
                  <th className="border p-4">Quantity</th>
                  <th className="border p-4">Unit Price</th>
                  <th className="border p-4">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="p-4 border">{item.product_id}</td>
                    <td className="p-4 border">{item.quantity}</td>
                    <td className="p-4 border">{item.base_price}</td>
                    <td className="p-4 border">{item.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ProductionManagerDashboard;
