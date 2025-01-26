"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (employeeNumber === "1234") {
      router.push("/quizz");
    } else {
      setError("מספר עובד לא תקין");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-6xl mb-6 font-semibold">כניסה למערכת</h1>
      <input
        type="text"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
        placeholder="מספר עובד"
        className="border p-4 mb-4 w-80 text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white p-4 rounded-lg text-lg hover:bg-blue-700 transition">
        התחבר
      </button>
      {error && <p className="text-red-600 mt-4 text-lg">{error}</p>}
    </div>
  );
};

export default LoginPage;
