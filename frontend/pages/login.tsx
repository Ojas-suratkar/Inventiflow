import React, { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password");
      return;
    }

    const userId = authData.user?.id;
    await supabase.auth.setSession(authData.session);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.role) {
      setError("User role not found");
      return;
    }

    if (profile.role !== role) {
      setError("Incorrect role. Please select the correct role for your account.");
      return;
    }

    setSuccess("Login successful!");

    setTimeout(() => {
      const roleRoutes = {
        Distributor: "/distributor-dashboard/dis_dashboard",
        "Warehouse Manager": "/warehouse-dashboard/war_dashboard",
        "Production Manager": "/production-dashboard/pro_dashboard",
        Vendor: "/vendor/dashboard",
        Admin: "/admin/dashboard",
      };

      const redirectTo = roleRoutes[profile.role];
      router.replace(redirectTo);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative">
      {/* Stylish "InventiFlow" Text Logo at Top-Right */}
      <div className="absolute top-6 right-8 text-3xl font-extrabold text-white">
        InventiFlow
      </div>

      {/* Centered Login Form */}
      <div className="w-full max-w-md p-8 bg-opacity-20 bg-black backdrop-blur-lg shadow-xl border border-gray-800 rounded-xl">
        <h2 className="text-4xl font-extrabold text-center text-white mb-6">Sign In</h2>
        <p className="text-center text-gray-400 mb-6">Access your InventiFlow account</p>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-gray-300">Role</Label>
            <Select onValueChange={setRole} required>
              <SelectTrigger className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3">
                <span>{role || "Select your role"}</span>
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border border-gray-700 text-white">
                <SelectItem value="Distributor">Distributor</SelectItem>
                <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                <SelectItem value="Production Manager">Production Manager</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 py-3 rounded-lg shadow-lg">
            Login
          </Button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account? <a href="/signup" className="text-indigo-400 underline">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
