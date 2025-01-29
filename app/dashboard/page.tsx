"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/app/lib/supabase/client";

interface EmployeeStats {
  employee_id: string;
  full_name: string;
  video_id: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  restart_count: number;
  started_at: string;
  completed_at: string | null;
  has_completed: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // First get test attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from("test_attempts")
          .select(
            `
            *,
            employees (full_name)
          `
          )
          .order("started_at", { ascending: false });

        // Then get responses
        const { data: responses, error: responsesError } = await supabase
          .from("user_responses")
          .select("*")
          .in("employee_id", attempts?.map((a) => a.employee_id) || []);

        console.log("Query result:", {
          attempts,
          responses,
          attemptsError,
          responsesError,
        });

        if (attemptsError || responsesError) {
          console.error("Supabase error:", attemptsError || responsesError);
          throw attemptsError || responsesError;
        }

        if (!attempts || !responses) {
          console.log("No data found");
          setStats([]);
          return;
        }

        // Process the data
        const stats = attempts?.reduce(
          (acc: Record<string, EmployeeStats>, curr) => {
            const key = `${curr.employee_id}-${curr.video_id}`;

            if (!acc[key]) {
              // Get all responses for this employee and video
              const employeeResponses =
                responses?.filter(
                  (r) =>
                    r.employee_id === curr.employee_id &&
                    r.video_id === curr.video_id
                ) || [];

              acc[key] = {
                employee_id: curr.employee_id,
                full_name: curr.employees?.full_name || "Unknown",
                video_id: curr.video_id,
                total_questions: employeeResponses.length,
                correct_answers: employeeResponses.filter((r) => r.is_correct)
                  .length,
                wrong_answers: employeeResponses.filter((r) => !r.is_correct)
                  .length,
                restart_count: 0,
                started_at: curr.started_at,
                completed_at: curr.completed_at,
                has_completed: curr.is_completed || false,
              };
            }

            return acc;
          },
          {}
        );

        setStats(Object.values(stats));
      } catch (error) {
        console.error("Error in fetchStats:", error);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center p-8">טוען נתונים...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-right">סטטיסטיקות מבחנים</h1>
      {stats.length === 0 ? (
        <div className="text-center p-4">אין נתונים זמינים</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={`${stat.employee_id}-${stat.video_id}`}>
              <CardContent className="p-4">
                <h2 className="font-bold text-lg mb-2 text-right">
                  {stat.full_name}
                </h2>
                <div className="space-y-2 text-right">
                  <p className="text-green-600">
                    שאלות נכונות: {stat.correct_answers}
                  </p>
                  <p className="text-red-600">
                    שאלות שגויות: {stat.wrong_answers}
                  </p>
                  <p>סה״כ שאלות: {stat.total_questions}</p>
                  <p>התחלות מחדש: {stat.restart_count}</p>
                  <p>
                    התחיל בתאריך:{" "}
                    {new Date(stat.started_at).toLocaleString("he-IL")}
                  </p>
                  <p
                    className={
                      stat.has_completed ? "text-green-600" : "text-yellow-600"
                    }>
                    סיים בתאריך:{" "}
                    {stat.completed_at
                      ? new Date(stat.completed_at).toLocaleString("he-IL")
                      : "לא הושלם"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
