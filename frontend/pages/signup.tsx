"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    company_location: "",
    role: "Distributor",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      let warehouseId = null;

      if (formData.role === "Distributor") {
        const { data: warehouses, error: warehouseError } = await supabase
          .from("warehouse")
          .select("id, service_pincodes");

        if (warehouseError) throw warehouseError;

        const assignedWarehouse = warehouses.find((warehouse) => {
          const pincodesArray = warehouse.service_pincodes;
          return Array.isArray(pincodesArray) && pincodesArray.includes(parseInt(formData.pincode));
        });

        if (!assignedWarehouse) {
          throw new Error("No warehouse available for the provided pin code. Please contact support.");
        }

        warehouseId = assignedWarehouse.id;
      }

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userId,
          name: formData.name,
          company_name: formData.company_name,
          company_location: formData.company_location,
          role: formData.role,
          email: formData.email,
          pincode: formData.pincode,
          warehouse_id: warehouseId,
        },
      ]);

      if (profileError) throw profileError;

      setFormData({
        name: "",
        email: "",
        password: "",
        company_name: "",
        company_location: "",
        role: "Distributor",
        pincode: "",
      });

      e.target.reset();
      alert("Signup successful! Warehouse linked based on your pin code.");
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Card className="w-full max-w-2xl bg-opacity-10 bg-black backdrop-blur-lg shadow-lg rounded-2xl p-8 border border-gray-700">
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-3xl font-extrabold text-white">Sign Up</CardTitle>
          <CardDescription className="text-md text-gray-400">
            Enter your details to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Row 1: Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Name</Label>
                <Input id="name" placeholder="John Doe" className="bg-gray-800 border border-gray-600 text-white rounded-lg" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input id="email" type="email" placeholder="example@email.com" className="bg-gray-800 border border-gray-600 text-white rounded-lg" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 2: Password & Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input id="password" type="password" className="bg-gray-800 border border-gray-600 text-white rounded-lg" value={formData.password} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="pincode" className="text-gray-300">Pin Code</Label>
                <Input id="pincode" type="text" placeholder="Enter your pin code" className="bg-gray-800 border border-gray-600 text-white rounded-lg" value={formData.pincode} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 3: Company Name */}
            <div>
              <Label htmlFor="company_name" className="text-gray-300">Company Name</Label>
              <Input id="company_name" placeholder="Your Company" className="bg-gray-800 border border-gray-600 text-white rounded-lg" value={formData.company_name} onChange={handleChange} required />
            </div>

            {/* Row 4: Company Location & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_location" className="text-gray-300">Company Location</Label>
                <Input id="company_location" placeholder="City, State" className="bg-gray-800 border border-gray-600 text-white rounded-lg" value={formData.company_location} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="role" className="text-gray-300">Role</Label>
                <Select onValueChange={handleRoleChange} value={formData.role}>
                  <SelectTrigger className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border border-gray-700 text-white">
                    <SelectItem value="Distributor">Distributor</SelectItem>
                    <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                    <SelectItem value="Production Manager">Production Manager</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 py-3 rounded-lg shadow-lg">
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>

            {/* Go to Login Button */}
            <Button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full mt-3 bg-gray-700 hover:bg-gray-800 transition-all duration-300 py-3 rounded-lg shadow-lg"
            >
              Already have an account? Login
            </Button>

            {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
