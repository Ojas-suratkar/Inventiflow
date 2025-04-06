// Full Component Code
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabaseClient";

export default function ReceivedOrders() {
  const [orders, setOrders] = useState([]); // To store fetched orders
  const [statusFilter, setStatusFilter] = useState("All"); // Filter: All, Accepted, Rejected, Pending
  const [profile, setProfile] = useState(null); // Warehouse Manager's Profile
  const [loading, setLoading] = useState(false); // Loading state

  // Fetch the manager's profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch orders whenever profile or status filter changes
  useEffect(() => {
    if (profile) {
      fetchOrders();
    }
  }, [statusFilter, profile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      console.log("Logged-in User ID:", user?.user?.id);

      const { data: managerData, error: managerError } = await supabase
        .from("warehouse_managers")
        .select("manager_id, warehouse_id")
        .eq("manager_id", user?.user?.id)
        .single();

      if (managerError || !managerData) {
        throw new Error("No warehouse assigned to this manager. Check the `warehouse_managers` table.");
      }

      console.log("Warehouse Manager Data Fetched:", managerData);
      setProfile(managerData);
    } catch (err) {
      console.error("Error fetching profile:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (!profile?.warehouse_id) {
        console.error("No warehouse assigned to this manager.");
        return;
      }

      console.log("Fetching orders for warehouse_id:", profile.warehouse_id);

      const { data: distributors, error: distributorError } = await supabase
        .from("profiles")
        .select("id")
        .eq("warehouse_id", profile.warehouse_id);

      if (distributorError) throw distributorError;

      const distributorIds = distributors.map((d) => d.id);
      console.log("Distributor IDs for warehouse:", distributorIds);

      if (distributorIds.length === 0) {
        console.log("No distributors linked to this warehouse.");
        setOrders([]);
        return;
      }

      let query = supabase.from("orders").select("id, product_id, packaging, quantity, status, distributor_id, price, deadline").in("distributor_id", distributorIds);
      if (statusFilter !== "All") {
        query = query.eq("status", statusFilter);
      }

      const { data: orders, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      console.log("Orders Query Result:", orders);
      setOrders(orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (order) => {
    try {
      console.log("Attempting to accept order:", order);
  
      // Check if packaging_id is defined
      if (!order.packaging) {
        console.error("Missing packaging_id for the order.");
        alert("The order is missing packaging information. Unable to process.");
        return;
      }
  
      // Fetch inventory for the specific warehouse, product, and packaging type
      const { data: inventoryRow, error: inventoryError } = await supabase
        .from("warehouse_inventory")
        .select("*")
        .eq("warehouse_id", profile.warehouse_id)
        .eq("product_id", order.product_id)
        .eq("packaging_id", order.packaging)
        .single(); // Expecting a single row
  
      if (inventoryError) {
        console.error("Error fetching inventory:", inventoryError.message);
        throw inventoryError;
      }
  
      console.log("Fetched inventory row:", inventoryRow);
  
      if (!inventoryRow) {
        alert("No inventory found for this product and packaging type in the warehouse.");
        return;
      }
  
      // Check if inventory is sufficient
      if (inventoryRow.quantity < order.quantity) {
        alert("Insufficient inventory for the specified packaging type. Unable to accept this order.");
        return;
      }
  
      console.log("Sufficient inventory available. Proceeding to deduct stock...");
  
      // Deduct inventory for the specific packaging type
      const { error: updateInventoryError } = await supabase
        .from("warehouse_inventory")
        .update({
          quantity: inventoryRow.quantity - order.quantity,
        })
        .eq("id", inventoryRow.id); // Match the specific inventory row by ID
  
      if (updateInventoryError) {
        console.error("Error updating inventory:", updateInventoryError.message);
        throw updateInventoryError;
      }
  
      console.log("Inventory updated successfully. Updating order status...");
  
      // Update the order status to "Accepted"
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({ status: "Accepted" })
        .eq("id", order.id);
  
      if (updateOrderError) {
        console.error("Error updating order status:", updateOrderError.message);
        throw updateOrderError;
      }
  
      console.log("Order status updated successfully. Refreshing orders...");
  
      // Refresh the orders list
      fetchOrders();
  
      alert("Order accepted successfully!");
    } catch (err) {
      console.error("Error accepting order:", err.message);
      alert("An error occurred while accepting the order.");
    }
  };
  
    

  const handleReject = async (orderId) => {
    try {
      await supabase.from("orders").update({ status: "Rejected" }).eq("id", orderId);
      fetchOrders();
      alert("Order rejected successfully!");
    } catch (err) {
      console.error("Error rejecting order:", err.message);
      alert("An error occurred while rejecting the order.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-800 p-4 flex flex-col items-center relative">
        <div className="rounded-full bg-gray-700 w-20 h-20 mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">{profile?.name || "Warehouse Manager"}</h3>
        <Button onClick={fetchOrders} className="bg-indigo-600 w-full mb-4">
          Refresh
        </Button>
        <div className="absolute bottom-6 left-6">
          <button
            onClick={() => alert("Chatbot Opened!")}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-lg"
          >
            💬
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Received Orders</h1>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search by Order ID" className="w-64" />
        </div>

        {/* Orders Table */}
        <div className="overflow-auto max-h-[70vh] max-w-full border border-gray-700">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-gray-800">
              <tr>
                <th className="border p-2">Sr. No</th>
                <th className="border p-2">Order ID</th>
                <th className="border p-2">Product Name</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Price/Unit</th>
                <th className="border p-2">Total Price</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-4">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id} className="border bg-gray-800">
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{order.id}</td>
                    <td className="border p-2">{order.product_name}</td>
                    <td className="border p-2">{order.quantity}</td>
                    <td className="border p-2">${order.price_per_unit}</td>
                    <td className="border p-2">${order.quantity * order.price_per_unit}</td>
                    <td className="border p-2">{new Date(order.deadline).toLocaleDateString()}</td>
                    <td className="border p-2">{order.status}</td>
                    <td className="border p-2 flex gap-2">
                      <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleAccept(order)}
                        disabled={order.status !== "Pending"}
                      >
                        Accept
                      </Button>
                      <Button
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => handleReject(order.id)}
                        disabled={order.status !== "Pending"}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
