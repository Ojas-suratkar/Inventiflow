import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import format from "date-fns/format";
import { Card } from "@/components/ui/card";

export default function WarOrderPlacement() {
  const [products, setProducts] = useState([]);
  const [packagingOptions, setPackagingOptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPackaging, setSelectedPackaging] = useState("");
  const [quantity, setQuantity] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [deadline, setDeadline] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (profile) fetchOrders();
  }, [profile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: managerData, error } = await supabase
        .from("warehouse_managers")
        .select("manager_id, warehouse_id")
        .eq("manager_id", user?.user?.id)
        .single();

      if (error || !managerData) throw new Error("No warehouse assigned to this manager.");
      setProfile(managerData);
    } catch (err) {
      console.error("Error fetching profile:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const FloatingWidgets = ({ notification }) => {
    return (
      <div>
        {/* Floating Notification Icon */}
        <div className="fixed top-4 right-4 z-50">
          <div className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg cursor-pointer transition duration-300 ease-in-out">
            <Bell className="w-6 h-6" />
            {notification && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-2">
                {notification}
              </span>
            )}
          </div>
        </div>
  
        {/* Floating Chatbot Icon (Now Positioned on the Left) */}
        <div className="fixed bottom-4 left-4 z-50">
          <div className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition duration-300 ease-in-out">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("id, name, category");
    if (error) throw error;
    setProducts(data || []);
  };

  const fetchPackaging = async (productId) => {
    const { data, error } = await supabase
      .from("packaging")
      .select("id, type, price")
      .eq("product_id", productId);

    if (error) throw error;
    setPackagingOptions(data || []);
  };

  const handleProductChange = (value) => {
    setSelectedProduct(value);
    fetchPackaging(value);
  };

  const handlePackagingChange = (value) => {
    setSelectedPackaging(value);
    const packaging = packagingOptions.find((p) => p.id === value);
    const price = packaging?.price || 0;
    setBasePrice(price);
    setTotalPrice(price * quantity);
  };

  const handleQuantityChange = (value) => {
    setQuantity(value);
    setTotalPrice(basePrice * value);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (!profile?.warehouse_id) return;
      
      console.log("Fetching orders for warehouse_id:", profile?.warehouse_id);
      
      const { data, error } = await supabase
        .from("war_orders")
        .select(`
          id, 
          product_id, 
          packaging_id, 
          quantity, 
          base_price, 
          total_price, 
          deadline, 
          status, 
          created_at, 
          products(name), 
          packaging(type)
        `)
        .eq("warehouse_id", profile?.warehouse_id)
        .order("created_at", { ascending: false });
  
      if (error) throw error;
  
      console.log("Fetched Orders:", data); // Debugging fetched data
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !selectedPackaging || !quantity || !deadline) {
      alert("Please fill in all required fields.");
      return;
    }

    const orderDetails = {
      warehouse_id: profile.warehouse_id,
      product_id: selectedProduct,
      packaging_id: selectedPackaging,
      quantity: parseInt(quantity, 10),
      base_price: basePrice,
      total_price: totalPrice,
      deadline: deadline.toISOString().split("T")[0],
      status: "Pending",
  
    };

    try {
      const { error } = await supabase.from("war_orders").insert([orderDetails]);
      if (error) throw error;

      alert("Order placed successfully!");
      setQuantity("");
      setDeadline(null);
      fetchOrders();
      
    } catch (err) {
      console.error("Error placing order:", err.message);
      alert("Failed to place order.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
  {/* Sidebar */}
  <aside className="w-64 bg-gray-900 p-6 flex flex-col justify-between border-r border-gray-700">
    <div>
      {/* Profile Card */}
      {profile ? (
        <Card className="bg-gray-800 p-4 mb-8 text-center shadow-lg rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white">{profile.name || "Warehouse Manager"}</h2>
          <p className="text-gray-400 text-sm">Warehouse ID: {profile.warehouse_id || "N/A"}</p>
          <p className="text-gray-400 text-sm">{profile.email}</p>
        </Card>
      ) : (
        <p className="text-gray-400 text-sm text-center">Loading profile...</p>
      )}

      <Button onClick={() => router.back()} className="bg-gray-600 hover:bg-gray-700 w-full mb-4">
        ← Back
      </Button>
      <Button onClick={fetchOrders} className="bg-indigo-600 w-full mb-4">Refresh</Button>
    </div>
  </aside>

  {/* Main Content */}
  <div className="flex-1 p-6 flex flex-col">
    <h1 className="text-2xl font-bold mb-6 text-yellow-400">Place Order to Production Manager</h1>

    {/* Order Form */}
    <div className="grid grid-cols-6 gap-4 items-center mb-6">
      <div className="col-span-2">
        <Label>Product Name</Label>
        <Select onValueChange={handleProductChange}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select a product" /></SelectTrigger>
          <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Label>Packaging</Label>
        <Select onValueChange={handlePackagingChange}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select packaging" /></SelectTrigger>
          <SelectContent>{packagingOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.type}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="col-span-1">
        <Label>Quantity</Label>
        <Input type="number" placeholder="Enter quantity" value={quantity} onChange={(e) => handleQuantityChange(e.target.value)} />
      </div>

      <div className="col-span-1">
        <Label>Price/Unit</Label>
        <Input type="text" value={`$${basePrice * quantity}`} readOnly />
      </div>

      {/* Date Picker */}
      <div className="col-span-2 relative">
        <Label>Deadline</Label>
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button className="bg-gray-700 text-white w-full">
              {deadline ? format(deadline, "dd MMM yyyy") : "Select Date"}
            </Button>
          </Popover.Trigger>
          <Popover.Content 
            side="bottom" 
            align="start" 
            className="bg-gray-800 text-white p-4 shadow-md rounded-lg absolute z-10 mt-2"
          >
            <DayPicker 
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
              fromDate={new Date()} 
            />
          </Popover.Content>
        </Popover.Root>
      </div>

      {/* Place Order Button */}
      <div className="col-span-6">
        <Button className="bg-indigo-600 hover:bg-indigo-700 w-full p-3 text-lg" onClick={handlePlaceOrder}>
          Place Order
        </Button>
      </div>
    </div>

    {/* Orders Table */}
    <div className="mt-6 overflow-auto max-h-[300px] border border-gray-700 rounded-lg shadow-md">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="border p-2">Sr. No</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">Packaging</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Total Price</th>
            <th className="border p-2">Deadline</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 text-white">
          {orders.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center p-4">No orders found.</td>
            </tr>
          ) : (
            orders.map((order, index) => (
              <tr key={order.id} className="border">
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{order.products?.name || "N/A"}</td>
                <td className="border p-2">{order.packaging?.type || "N/A"}</td>
                <td className="border p-2">{order.quantity}</td>
                <td className="border p-2">${order.total_price}</td>
                <td className="border p-2">{order.deadline}</td>
                <td className="border p-2 text-yellow-400">{order.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
  )
}