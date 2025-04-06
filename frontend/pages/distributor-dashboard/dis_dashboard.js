import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Bell, MessageCircle } from "lucide-react";

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

const DistributorDashboard = () => {
  const [notification, setNotification] = useState(null);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  // Redirect non-distributors away from the page
  useEffect(() => {
    const checkRole = async () => {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      console.log("🔍 Checking user session:", session);

      if (sessionError || !session || !session.session) {
        console.error("❌ No active session found. Redirecting to login.");
        router.replace("/login");
        return;
      }

      const userId = session.session.user.id;
      
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, name, email, company_name, company_location")
        .eq("id", userId)
        .single();

      if (profileError || profileData.role !== "Distributor") {
        console.error("❌ Unauthorized role or profile error:", profileError);
        router.replace("/login");
        return;
      }

      setProfile(profileData);
      console.log("✅ Profile Data Loaded:", profileData);
    };

    checkRole();
  }, [router]);

  // Static data for most demanded products
  const mostDemandedProducts = [
    { name: "Product A", productId: "P001", demand: 150 },
    { name: "Product B", productId: "P002", demand: 120 },
    { name: "Product C", productId: "P003", demand: 100 },
    { name: "Product D", productId: "P004", demand: 80 },
    { name: "Product E", productId: "P005", demand: 60 },
  ];

  if (!profile) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-6 flex flex-col justify-between">
        <div>
          {/* Profile Card */}
          <Card className="bg-gray-800 p-4 mb-8 text-center">
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            <p className="text-gray-400 text-sm">{profile.role}</p>
            <p className="text-gray-400 text-sm mt-2">{profile.email}</p>
            <p className="text-gray-400 text-sm mt-2">{profile.company_name}</p>
            <p className="text-gray-400 text-sm mt-2">{profile.company_location}</p>
          </Card>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Top Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className="p-4 bg-gray-800 text-center cursor-pointer hover:bg-gray-700"
            onClick={() => router.push("/distributor-dashboard/dis_order_placement")}

          >
            <h2 className="text-xl font-bold">Place an Order</h2>
          </Card>
          <Card
            className="p-4 bg-gray-800 text-center cursor-pointer hover:bg-gray-700"
            onClick={() => router.push("/distributor-dashboard/dis_order_history")}
          >
            <h2 className="text-xl font-bold">Order History</h2>
          </Card>
          <Card
            className="p-4 bg-gray-800 text-center cursor-pointer hover:bg-gray-700"
            onClick={() => router.replace("/distributor-dashboard/dis_analytics")}
          >
            <h2 className="text-xl font-bold">Analytics</h2>
          </Card>
        </div>

        {/* Data Table Section */}
        <Card className="p-6 bg-gray-800">
          <h2 className="text-xl font-bold mb-4">Most Demanded Products</h2>
          <DataTable
            columns={[
              { id: "name", Header: "Product Name", accessorKey: "name" },
              { id: "productId", Header: "Product ID", accessorKey: "productId" },
              { id: "demand", Header: "Demand", accessorKey: "demand" },
            ]}
            data={mostDemandedProducts}
            className="bg-gray-800 text-white"
          />
        </Card>
      </main>

      {/* Floating Widgets for Notifications & Chatbot */}
      <FloatingWidgets notification={notification} />
    </div>
  );
};

export default DistributorDashboard;
