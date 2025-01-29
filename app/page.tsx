import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="text-center space-y-8">
        <Image
          src="/logo.png"
          alt="video"
          width={450}
          height={450}
          className="border-2 border-gray-300 rounded-lg mx-auto hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-4xl font-bold text-gray-800">
          ברוך הבא למערכת הסרטונים
        </h1>
        <p className="text-lg text-gray-600">
          המערכת מספקת סרטונים מסכמים ומסכמים של כל הסרטונים שלך
        </p>
        <div className="flex flex-col gap-4">
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-lg">
            כניסה למערכת
          </Link>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-lg">
            לדף הבקרה
          </Link>
        </div>
      </div>
    </div>
  );
}
