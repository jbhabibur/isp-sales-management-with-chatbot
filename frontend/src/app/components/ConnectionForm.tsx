"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConnectionFormProps {
  packageId: number;
  packageName: string;
}

export default function ConnectionForm({
  packageId,
  packageName,
}: ConnectionFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    city: "",
    area: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          package_id: packageId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Request submit করা যায়নি।");
      }

      setSuccess(true);
      setMessage(
        `Request successful! Order ID: ${data.order_id}. Status: ${data.status}`,
      );

      setForm({
        customer_name: "",
        phone: "",
        city: "",
        area: "",
        address: "",
      });

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      );
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      name: "customer_name",
      label: "Customer Name",
      placeholder: "Enter your full name",
    },
    {
      name: "phone",
      label: "Phone Number",
      placeholder: "01XXXXXXXXX",
    },
    {
      name: "city",
      label: "City",
      placeholder: "e.g. Dhaka",
    },
    {
      name: "area",
      label: "Area",
      placeholder: "e.g. Savar",
    },
    {
      name: "address",
      label: "Full Address",
      placeholder: "Enter your full address",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <h4 className="font-semibold">Request: {packageName}</h4>

      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {field.label}
          </label>

          <input
            id={field.name}
            name={field.name}
            value={form[field.name as keyof typeof form]}
            onChange={handleChange}
            placeholder={field.placeholder}
            required
            minLength={field.name === "phone" ? 6 : 2}
            maxLength={field.name === "address" ? 500 : 100}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Connection Request"}
      </button>

      {message && (
        <p
          role="status"
          className={
            success ? "text-sm text-green-700" : "text-sm text-red-600"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
