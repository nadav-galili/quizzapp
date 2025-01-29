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
  completed_at: string;
  has_completed: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get all responses with employee details and video info
        const { data: responses, error } = await supabase
          .from("user_responses")
          .select(
            `
            *,
            employees (full_name),
            video_questions (video_id)
          `
          )
          .order("answered_at", { ascending: false });

        console.log("Query result:", { responses, error });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (!responses) {
          console.log("No responses found");
          setStats([]);
          return;
        }

        // Process the data
        const stats = responses.reduce(
          (acc: Record<string, EmployeeStats>, curr) => {
            const key = `${curr.employee_id}-${curr.video_questions.video_id}`;

            if (!acc[key]) {
              acc[key] = {
                employee_id: curr.employee_id,
                full_name: curr.employees?.full_name || "Unknown",
                video_id: curr.video_questions?.video_id || "Unknown",
                total_questions: 0,
                correct_answers: 0,
                wrong_answers: 0,
                restart_count: 0,
                completed_at: curr.answered_at,
                has_completed: false,
              };
            }

            acc[key].total_questions++;
            if (curr.is_correct) {
              acc[key].correct_answers++;
            } else {
              acc[key].wrong_answers++;
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
                  <p>שאלות נכונות: {stat.correct_answers}</p>
                  <p>שאלות שגויות: {stat.wrong_answers}</p>
                  <p>סה״כ שאלות: {stat.total_questions}</p>
                  <p>התחלות מחדש: {stat.restart_count}</p>
                  <p>
                    ציון:{" "}
                    {(
                      (stat.correct_answers / stat.total_questions) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                  <p>
                    תאריך סיום:{" "}
                    {new Date(stat.completed_at).toLocaleDateString("he-IL")}
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
