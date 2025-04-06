import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const PlaceOrder = () => {
  const [products, setProducts] = useState([]);
  const [packagingOptions, setPackagingOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPackaging, setSelectedPackaging] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deadline, setDeadline] = useState(null);
  const [price, setPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("id, name, category");
      if (error) console.error("Error fetching products:", error);
      else setProducts(data);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const fetchPackaging = async () => {
        const { data, error } = await supabase
          .from("packaging")
          .select("id, type, price")
          .eq("product_id", selectedProduct);
        if (error) console.error("Error fetching packaging:", error);
        else setPackagingOptions(data);
      };
      fetchPackaging();

      const selectedProd = products.find((p) => p.id === selectedProduct);
      if (selectedProd) setCategory(selectedProd.category);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedPackaging) {
      const selectedPack = packagingOptions.find((p) => p.id === selectedPackaging);
      if (selectedPack) {
        setPrice(selectedPack.price);
        setTotalPrice(selectedPack.price * quantity);
      }
    }
  }, [selectedPackaging, quantity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const { data: session } = await supabase.auth.getSession();
    if (!session || !session.session) {
      setMessage("User session not found. Please log in.");
      return;
    }

    const userId = session.session.user.id;
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).single();
    if (!profile) {
      setMessage("Distributor profile not found.");
      return;
    }

    const { error } = await supabase.from("orders").insert([
      {
        distributor_id: profile.id,
        product_id: selectedProduct,
        packaging: selectedPackaging,
        quantity,
        price: totalPrice,
        deadline,
        status: "Pending",
      },
    ]);
    if (error) setMessage("Error placing order: " + error.message);
    else {
      setMessage("Order placed successfully!");
      router.push("/distributor-dashboard/dis_dashboard"); // Redirect to dashboard after order
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <Button onClick={() => router.push("/distributor-dashboard/dis_dashboard")} className="mb-4">Back</Button>
      <Card className="p-6 bg-gray-800 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">Place an Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select onValueChange={setSelectedProduct} required>
            <SelectTrigger className="w-full">{selectedProduct || "Select Product"}</SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="text" value={category} readOnly placeholder="Category" className="w-full" />

          <Select onValueChange={setSelectedPackaging} required>
            <SelectTrigger className="w-full">{selectedPackaging || "Select Packaging"}</SelectTrigger>
            <SelectContent>
              {packagingOptions.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>{pkg.type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min="1"
            required
            placeholder="Enter Quantity"
          />

          <Input type="text" value={`Price per unit: $${price}`} readOnly className="w-full" />
          <Input type="text" value={`Total Price: $${totalPrice}`} readOnly className="w-full" />

          <Popover.Root>
           <Popover.Trigger asChild>
             <Button className="w-full">{deadline ? deadline.toLocaleDateString() : "Pick a deadline"}</Button>
           </Popover.Trigger>
           <Popover.Content className="bg-gray-800 p-4 rounded-lg">
             <DayPicker
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
            />
          </Popover.Content>
          </Popover.Root>


          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Confirm Order</Button>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </Card>
    </div>
  );
};

export default PlaceOrder;
