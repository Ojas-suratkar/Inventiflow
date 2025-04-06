import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as Popover from "@radix-ui/react-popover";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]); // All orders from the database
  const [filteredOrders, setFilteredOrders] = useState([]); // Filtered orders for display
  const [filters, setFilters] = useState({
    status: "",
    productName: "",
    packaging: "",
    minPrice: "",
    maxPrice: "",
  });
  const router = useRouter();

  // Fetch orders for the logged-in distributor
  useEffect(() => {
    const fetchOrders = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        router.replace("/login");
        return;
      }

      const userId = session.session.user.id;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          product_id (name),
          packaging,
          quantity,
          price,
          deadline,
          status,
          created_at
        `)
        .eq("distributor_id", userId);

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        console.log("Fetched orders:", data);
        setOrders(data || []);
        setFilteredOrders(data || []); // Initialize filteredOrders
      }
    };

    fetchOrders();
  }, [router]);

  // Filter orders whenever filters or orders change
  useEffect(() => {
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter((order) => order.status === filters.status);
    }
    if (filters.productName) {
      filtered = filtered.filter((order) =>
        order.product_id.name
          .toLowerCase()
          .includes(filters.productName.toLowerCase())
      );
    }
    if (filters.packaging) {
      filtered = filtered.filter((order) => order.packaging === filters.packaging);
    }
    if (filters.minPrice) {
      filtered = filtered.filter((order) => order.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((order) => order.price <= Number(filters.maxPrice));
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  const updateFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-6 flex flex-col justify-between">
        <Card className="bg-gray-800 p-4 mb-8 text-center">
          <h2 className="text-xl font-bold text-white">Distributor Name</h2>
          <p className="text-gray-400 text-sm">Distributor</p>
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => router.push("/distributor-dashboard/dis_dashboard")}>
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Order History</h1>
        </div>

        {/* Filters */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button className="bg-gray-800 text-white hover:bg-gray-700">Filter By</Button>
          </Popover.Trigger>
          <Popover.Content className="p-4 bg-gray-900 rounded-lg shadow-lg">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-300">Order Status</h4>
              <select
                value={filters.status}
                onChange={(e) => updateFilter("status", e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg p-2"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>

              <h4 className="text-sm font-bold text-gray-300">Product Name</h4>
              <input
                type="text"
                value={filters.productName}
                onChange={(e) => updateFilter("productName", e.target.value)}
                placeholder="Enter product name"
                className="w-full bg-gray-800 text-white rounded-lg p-2"
              />

              <h4 className="text-sm font-bold text-gray-300">Packaging</h4>
              <input
                type="text"
                value={filters.packaging}
                onChange={(e) => updateFilter("packaging", e.target.value)}
                placeholder="Enter packaging type"
                className="w-full bg-gray-800 text-white rounded-lg p-2"
              />

              <h4 className="text-sm font-bold text-gray-300">Price Range</h4>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  placeholder="Min"
                  className="w-full bg-gray-800 text-white rounded-lg p-2"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  placeholder="Max"
                  className="w-full bg-gray-800 text-white rounded-lg p-2"
                />
              </div>
            </div>
          </Popover.Content>
        </Popover.Root>

        {/* Orders Table */}
        <Card className="p-6 bg-gray-800 mt-4">
          <h2 className="text-xl font-bold mb-4">Orders</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full bg-gray-900 text-white">
              <thead>
                <tr>
                  <th className="px-4 py-2">S.No</th>
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Product Name</th>
                  <th className="px-4 py-2">Packaging</th>
                  <th className="px-4 py-2">Quantity</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Order Date</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr key={order.id}>
                    <td className="border px-4 py-2">{idx + 1}</td>
                    <td className="border px-4 py-2">{order.id}</td>
                    <td className="border px-4 py-2">{order.product_id.name}</td>
                    <td className="border px-4 py-2">{order.packaging}</td>
                    <td className="border px-4 py-2">{order.quantity}</td>
                    <td className="border px-4 py-2">{order.price}</td>
                    <td className="border px-4 py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="border px-4 py-2">{order.status}</td>
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

export default OrderHistory;
