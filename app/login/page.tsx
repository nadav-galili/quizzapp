"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeNumber) {
      setError("אנא הזן מספר עובד");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_number, full_name, id") // Added full_name and id to the selection
        .eq("employee_number", employeeNumber)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        router.push(
          `/quizz?full_name=${encodeURIComponent(data.full_name)}&employee_id=${
            data.id
          }`
        ); // Pass full_name and employee_id to the /quizz route
      } else {
        setError("מספר עובד לא נמצא במערכת");
      }
    } catch (err) {
      console.error(err);
      setError("שגיאה בבדיקת פרטי ההתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-6xl mb-6 font-semibold">כניסה למערכת</h1>
      <div className="relative">
        <input
          type="text"
          value={employeeNumber}
          onChange={(e) => {
            setError("");
            setEmployeeNumber(e.target.value);
          }}
          placeholder="מספר עובד"
          className="border p-4 mb-4 w-80 text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
        />
        {isLoading && (
          <div className="absolute right-3 top-5">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
          </div>
        )}
      </div>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="bg-blue-600 text-white p-4 rounded-lg text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
        התחבר
      </button>
      {error && <p className="text-red-600 mt-4 text-lg">{error}</p>}
    </div>
  );
}
