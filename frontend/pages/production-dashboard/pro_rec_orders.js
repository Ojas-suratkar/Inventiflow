import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";

const ReceivedOrdersPage = () => {
  const router = useRouter();
  const [managerDetails, setManagerDetails] = useState(null);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [filters, setFilters] = useState({
    product: "",
    status: "",
  });

  // Authenticate and load manager details
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
        console.error("❌ Unauthorized or no profile found.");
        router.replace("/login");
      } else {
        console.log("✅ Manager Profile:", data);
        setManagerDetails(data);
        fetchReceivedOrders(data.id);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch orders for the production manager
  const fetchReceivedOrders = async (managerId) => {
    try {
      console.log("🔄 Fetching factory for manager ID:", managerId);

      const { data: factoryData, error: factoryError } = await supabase
        .from("production_manager_factory")
        .select("factory_id")
        .eq("prod_manager_id", managerId)
        .single();

      if (factoryError || !factoryData) {
        console.error("❌ Error fetching factory data:", factoryError);
        return;
      }

      const factoryId = factoryData.factory_id;
      console.log("🏭 Factory ID:", factoryId);

      // STEP 1: Get product_ids linked to this factory from factories table
      const { data: productMappings, error: mapError } = await supabase
        .from("factories")
        .select("product_id")
        .eq("id", factoryId);

      if (mapError || !productMappings || productMappings.length === 0) {
        console.warn("⚠️ No products mapped to this factory.");
        return setReceivedOrders([]);
      }

      const productIds = productMappings.map((item) => item.product_id);
      console.log("🔗 Product IDs linked to factory:", productIds);

      // STEP 2: Get only orders for those product_ids
      const { data: orders, error: ordersError } = await supabase
        .from("war_orders")
        .select(`
          id,
          product_id,
          packaging_id,
          quantity,
          base_price,
          total_price,
          status,
          deadline,
          created_at,
          products(name),
          packaging(type)
        `)
        .in("product_id", productIds)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("❌ Error fetching filtered orders:", ordersError);
      } else {
        console.log("✅ Filtered Orders:", orders);
        setReceivedOrders(orders || []);
      }
    } catch (err) {
      console.error("❌ General error fetching orders:", err.message);
    }
  };

// Accept order with inventory check
const handleAccept = async (orderId) => {
  try {
    // Step 1: Fetch the Order Details
    console.log("🔄 Fetching order details for Order ID:", orderId);
    
    const { data: orderData, error: orderError } = await supabase
      .from("war_orders")
      .select("product_id, packaging_id, quantity")
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("❌ Error fetching order details:", orderError.message);
      alert("An error occurred while fetching order details.");
      return;
    }
    console.log("✅ Order Details:", orderData);

    // Step 2: Fetch the Raw Materials Required for the Product
    console.log("🔄 Fetching product recipe for Product ID:", orderData.product_id);

    const { data: productRecipes, error: recipesError } = await supabase
      .from("product_recipes")
      .select("raw_material_id, quantity_per_unit")
      .eq("product_id", orderData.product_id)
      .eq("packaging_id", orderData.packaging_id);

    if (recipesError) {
      console.error("❌ Error fetching product recipes:", recipesError.message);
      alert("An error occurred while fetching product recipes.");
      return;
    }

    console.log("✅ Product Recipes (Raw Materials):", productRecipes);

    // Step 3: Trigger the Supabase function to check stock and update order status
    const { data: orderUpdateData, error: triggerError } = await supabase
      .from("war_orders")
      .update({ status: "Pending" }) // Set to 'Pending' to trigger backend function
      .eq("id", orderId);

    if (triggerError) {
      console.error("❌ Error triggering Supabase function for order acceptance:", triggerError.message);
      alert("An error occurred while processing the order.");
      return;
    }

    console.log("✅ Order acceptance triggered successfully.");
    fetchReceivedOrders(managerDetails.id); // Refresh the orders list
    alert("Order accepted successfully!");
  } catch (err) {
    console.error("❌ Exception while accepting order:", err.message);
    alert("An error occurred while processing the order.");
  }
};


  // Apply Filters
  const filteredOrders = receivedOrders.filter((order) => {
    return (
      (!filters.product ||
        order.products?.name.toLowerCase().includes(filters.product.toLowerCase())) &&
      (!filters.status ||
        order.status.toLowerCase().includes(filters.status.toLowerCase()))
    );
  });

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
          <h1 className="text-3xl font-bold">Received Orders</h1>
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
            <h3 className="text-lg font-bold mb-4">Filter Orders</h3>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Product Name"
                value={filters.product}
                onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                className="bg-gray-800 text-white"
              />
              <Input
                type="text"
                placeholder="Order Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-gray-800 text-white"
              />
            </div>
          </Popover.Content>
        </Popover.Root>

        {/* Orders Table */}
        <Card className="p-6 bg-gray-800 mt-4">
          <h2 className="text-xl font-bold mb-4">Received Orders</h2>
          <div className="overflow-auto max-h-80 border border-gray-700">
            <table className="min-w-full border-collapse bg-gray-800 text-center border border-gray-700">
              <thead>
                <tr>
                  <th className="border p-4">Product Name</th>
                  <th className="border p-4">Packaging</th>
                  <th className="border p-4">Quantity</th>
                  <th className="border p-4">Status</th>
                  <th className="border p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-4">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-700">
                      <td className="p-4 border">{order.products?.name || "—"}</td>
                      <td className="p-4 border">{order.packaging?.type || "—"}</td>
                      <td className="p-4 border">{order.quantity}</td>
                      <td className="p-4 border capitalize">{order.status}</td>
                      <td className="p-4 border space-x-2">
                        {order.status.toLowerCase() === "pending" ? (
                          <>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAccept(order.id)}
                              disabled={order.status !== "Pending"}
                            >
                              Accept
                            </Button>
                            <Button
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleReject(order.id)}
                              disabled={order.status !== "Pending"}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400 capitalize">
                            {order.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ReceivedOrdersPage;
