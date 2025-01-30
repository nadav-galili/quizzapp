"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/app/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Goal } from "./components/goal";
import { Users, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";

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
  const router = useRouter();
  const [videoStats, setVideoStats] = useState<
    Record<
      string,
      {
        totalViews: number;
        passed: number;
        failed: number;
        incomplete: number;
        title?: string;
      }
    >
  >({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Add videos query
        const { data: videos, error: videosError } = await supabase
          .from("videos")
          .select("id, title");

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

        // Get restart counts
        const { data: restarts, error: restartsError } = await supabase
          .from("video_restarts")
          .select("*")
          .in("employee_id", attempts?.map((a) => a.employee_id) || []);

        if (attemptsError || responsesError || restartsError || videosError) {
          console.error(
            "Supabase error:",
            attemptsError || responsesError || restartsError || videosError
          );
          throw attemptsError || responsesError || restartsError || videosError;
        }

        if (!attempts || !responses || !restarts) {
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

              // Get restart counts for this employee and video
              const employeeRestarts =
                restarts?.filter(
                  (r) =>
                    r.employee_id === curr.employee_id &&
                    r.video_id === curr.video_id
                ) || [];

              acc[key] = {
                employee_id: curr.employee_id,
                full_name: curr.employees?.full_name || "Unknown",
                video_id: curr.video_id,
                total_questions: [
                  ...new Set(employeeResponses.map((r) => r.question_id)),
                ].length,
                correct_answers: employeeResponses.filter((r) => r.is_correct)
                  .length,
                wrong_answers: employeeResponses.filter((r) => !r.is_correct)
                  .length,
                restart_count: employeeRestarts.length,
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

        // Calculate enhanced video stats
        const videoTitles = videos?.reduce((acc: Record<string, string>, v) => {
          acc[v.id] = v.title;
          return acc;
        }, {});

        const videoStats = attempts?.reduce(
          (
            acc: Record<
              string,
              {
                totalViews: number;
                passed: number;
                failed: number;
                incomplete: number;
                title?: string;
              }
            >,
            curr
          ) => {
            if (!acc[curr.video_id]) {
              acc[curr.video_id] = {
                totalViews: 0,
                passed: 0,
                failed: 0,
                incomplete: 0,
                title: videoTitles?.[curr.video_id] || "Unknown",
              };
            }

            acc[curr.video_id].totalViews++;

            // Get responses for this attempt
            const attemptResponses =
              responses?.filter(
                (r) =>
                  r.employee_id === curr.employee_id &&
                  r.video_id === curr.video_id
              ) || [];

            const correctAnswers = attemptResponses.filter(
              (r) => r.is_correct
            ).length;

            if (!curr.is_completed) {
              acc[curr.video_id].incomplete++;
            } else if (correctAnswers >= 2) {
              acc[curr.video_id].passed++;
            } else {
              acc[curr.video_id].failed++;
            }

            return acc;
          },
          {}
        );

        setVideoStats(videoStats || {});
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
      {/* Video Stats Summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="font-bold text-3xl mb-2 text-right">
            סיכום צפיות בסרטונים
          </h2>
          <div className="space-y-2 text-right">
            {Object.entries(videoStats).map(([videoId, stats]) => (
              <div key={videoId} className="border-b pb-4">
                <p className="font-semibold text-2xl text-blue-500 flex items-center justify-end gap-2">
                  <span>{stats.title || `סרטון ${videoId}`}</span>
                  <Users className="h-6 w-6" />
                </p>
                <div className="flex flex-col md:flex-row gap-6 mt-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-end gap-2 bg-gray-50 p-2 rounded-lg">
                      <p>סה״כ צפיות: {stats.totalViews}</p>
                      <Eye className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex items-center justify-end gap-2 bg-green-50 p-2 rounded-lg">
                      <p className="text-green-600">
                        עברו בהצלחה: {stats.passed}
                      </p>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-end gap-2 bg-red-50 p-2 rounded-lg">
                      <p className="text-red-600">נכשלו: {stats.failed}</p>
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex items-center justify-end gap-2 bg-yellow-50 p-2 rounded-lg">
                      <p className="text-yellow-600">
                        טרם השלימו: {stats.incomplete}
                      </p>
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Goal stats={stats} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                    תשובות נכונות: {stat.correct_answers}
                  </p>
                  <p className="text-red-600">
                    תשובות שגויות: {stat.wrong_answers}
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

      {/* add a button to go back to the home page  */}
      <div className="flex justify-center mt-4">
        <Button
          onClick={() => router.push("/")}
          className="mt-4 bg-blue-500 text-white">
          חזרה לדף הבית
        </Button>
      </div>
    </div>
  );
}
