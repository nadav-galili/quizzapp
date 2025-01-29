"use client";
import React, { useState, useMemo, useEffect } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase/client";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  time: number;
  question: string;
  options: string[];
  answer: string;
}

interface Assignment {
  video_id: string;
}

// Separate the main quiz content into a component
const QuizContent = () => {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [questionsData, setQuestionsData] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [restartCount, setRestartCount] = useState(0);
  const [lastWrongAnswer, setLastWrongAnswer] = useState<string | null>(null);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [testAttemptId, setTestAttemptId] = useState<string | null>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Get employee info from query params
  const searchParams = useSearchParams();
  const fullName = searchParams.get("full_name");
  const employeeId = searchParams.get("employee_id");

  //display the employee name in the top right corner
  const [employeeName, setEmployeeName] = useState(fullName);
  useEffect(() => {
    setEmployeeName(fullName);
  }, [fullName]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("🚀 ~ Current auth session:", session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        if (!employeeId) {
          throw new Error("Missing employee ID");
        }

        // 1. Get assigned videos
        const { data: assignments, error: assignmentError } = await supabase
          .from("employee_video_assignments")
          .select("video_id")
          .eq("employee_id", employeeId);

        console.log("🚀 ~ assignments query result:", {
          assignments,
          assignmentError,
        });

        if (assignmentError || !assignments) {
          throw assignmentError || new Error("No video assignments found");
        }

        // Store assignments in state
        setAssignments(assignments || []);

        // 2. Validate assigned video
        const videoId = assignments[0]?.video_id;
        if (!videoId) {
          setVideoError("No assigned videos found");
          return;
        }
        console.log("🚀 ~ Fetching video with ID:", videoId);

        // 3. Fetch video details with better error handling
        const { data: video, error: videoError } = await supabase
          .from("videos")
          .select("*") // Select all columns for debugging
          .eq("id", videoId);

        console.log("🚀 ~ Video query result:", { video, videoError });

        if (videoError) throw videoError;
        if (!video?.length) {
          throw new Error(`Video not found for ID: ${videoId}`);
        }

        setVideoUrl(video[0].video_url);

        // 4. Load and validate questions
        const { data: questions, error: questionError } = await supabase
          .from("video_questions")
          .select("*")
          .eq("video_id", videoId)
          .order("question_order", { ascending: true });

        if (questionError || !questions?.length) {
          throw questionError || new Error("No questions found for this video");
        }

        // Validate question format
        const formattedQuestions = questions.map((q) => {
          if (!q.options || !Array.isArray(q.options)) {
            throw new Error("Invalid question options format");
          }
          return {
            id: q.id,
            time: q.timestamp,
            question: q.question,
            options: q.options,
            answer: q.options[q.correct_answer],
          };
        });

        setQuestionsData(formattedQuestions);
      } catch (err) {
        console.error("Video load error:", err);
        setVideoError(
          err instanceof Error ? err.message : "שגיאה בטעינת סרטון ההדרכה"
        );
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) fetchVideoData();
  }, [employeeId]);

  // Update existing questions reference
  const questions: Question[] = useMemo(() => questionsData, [questionsData]);

  // Add player ref
  const playerRef = React.useRef<ReactPlayer>(null);

  const handleProgress = (progress: { playedSeconds: number }) => {
    const currentTime = progress.playedSeconds;
    if (currentQuestionIndex === -1) {
      questions.forEach((q, index) => {
        if (
          currentTime >= q.time &&
          currentTime < q.time + 1 &&
          !userAnswers[index]
        ) {
          setPlaying(false);
          setCurrentQuestionIndex(index);
        }
      });
    }
  };

  const handleAnswer = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.answer;

    if (!isCorrect) {
      setLastWrongAnswer(answer); // Set the wrong answer when incorrect
    } else {
      setLastWrongAnswer(null); // Reset when correct
    }

    try {
      const { error } = await supabase.from("user_responses").insert({
        employee_id: employeeId,
        video_id: assignments[0]?.video_id,
        question_id: questions[currentQuestionIndex].id,
        selected_answer: answer,
        is_correct: isCorrect,
        attempt_number: attempts[currentQuestionIndex] || 0,
      });

      if (error) {
        console.error("Supabase error:", error.message, error.details);
        throw error;
      }

      if (!isCorrect) {
        const questionAttempts = attempts[currentQuestionIndex] || 0;

        if (questionAttempts === 0) {
          setAttempts((prev) => ({
            ...prev,
            [currentQuestionIndex]: 1,
          }));
          return;
        } else {
          alert("Starting over!");
          // Increment restart count and log it
          setRestartCount((prev) => prev + 1);
          await supabase.from("video_restarts").insert({
            employee_id: employeeId,
            video_id: assignments[0]?.video_id,
            restart_count: restartCount + 1,
            restarted_at: new Date().toISOString(),
          });

          playerRef.current?.seekTo(0);
          setCurrentQuestionIndex(-1);
          setUserAnswers([]);
          setAttempts({});
          setPlaying(false);
          setHasStarted(false);
          return;
        }
      }

      setUserAnswers((prev) => [...prev, answer]);
      setCurrentQuestionIndex(-1);
      setPlaying(true);
    } catch (err) {
      console.error(
        "Error storing response:",
        err instanceof Error ? err.message : err
      );
      // Continue with quiz even if storage fails
    }
  };

  const handleEnded = async () => {
    setIsVideoEnded(true);
    setPlaying(false);

    if (testAttemptId) {
      const totalQuestions = questions.length;
      const correctAnswers = userAnswers.filter(
        (answer, index) => answer === questions[index].answer
      ).length;
      const passed = correctAnswers / totalQuestions >= 0.6; // 60% passing grade

      try {
        await supabase
          .from("test_attempts")
          .update({
            completed_at: new Date().toISOString(),
            passed,
            is_completed: true,
          })
          .eq("id", testAttemptId);

        setIsTestCompleted(true);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (error) {
        console.error("Error updating test completion:", error);
      }
    }
  };

  const handleStart = async () => {
    try {
      const { data, error } = await supabase
        .from("test_attempts")
        .insert({
          employee_id: employeeId,
          video_id: assignments[0]?.video_id,
        })
        .select()
        .single();

      if (error) throw error;
      setTestAttemptId(data.id);
      setHasStarted(true);
      setPlaying(true);
    } catch (err) {
      console.error("Error creating test attempt:", err);
      setHasStarted(true);
      setPlaying(true);
    }
  };

  const getCurrentQuestionUI = () => {
    if (currentQuestionIndex === -1) return null;

    const question = questions[currentQuestionIndex];
    const currentAttempt = attempts[currentQuestionIndex] || 0;

    return (
      <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white shadow-lg z-10">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4 text-right">
            {question.question}
          </h2>
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className={`w-full text-right ${
                  currentAttempt === 1 && option === lastWrongAnswer
                    ? "border-2 border-red-500 text-red-500 bg-red-50"
                    : ""
                }`}
                onClick={() => handleAnswer(option)}>
                {option}
              </Button>
            ))}
          </div>
          {currentAttempt === 1 && (
            <p className="text-red-500 mt-2 text-right">
              תשובה שגויה! יש לך עוד ניסיון אחד.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    const getResults = async () => {
      if (!isVideoEnded) return;

      console.log("🚀 ~ Query params:", {
        employeeId,
        videoId: assignments[0]?.video_id,
      });

      // Get responses with better error handling
      const { data: responses, error: responsesError } = await supabase
        .from("user_responses")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("video_id", assignments[0]?.video_id);

      console.log("🚀 ~ Full query result:", {
        responses,
        responsesError,
        params: {
          employeeId,
          videoId: assignments[0]?.video_id,
        },
      });

      if (responsesError) {
        console.error("Error fetching responses:", responsesError);
        return;
      }

      const correctAnswers =
        responses?.filter((r) => r.is_correct === true).length || 0;
      const wrongAnswers =
        responses?.filter((r) => r.is_correct === false).length || 0;
      const totalRestarts = restartCount;

      console.log("🚀 ~ Calculated results:", {
        correctAnswers,
        wrongAnswers,
        totalRestarts,
        responses: responses?.length,
      });
    };

    if (isVideoEnded) {
      getResults();
    }
  }, [isVideoEnded, employeeId, assignments, restartCount]);

  if (loading) return <div className="text-center p-8">טוען סרטון...</div>;
  if (videoError)
    return <div className="text-red-500 text-center p-8">{videoError}</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Add wrapper div with width constraint */}
      <div className="w-full mx-auto">
        {" "}
        {/* This makes the frame 50% width and centered */}
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={playing}
            controls={true}
            width="100%"
            height="100%"
            onProgress={handleProgress}
            onEnded={handleEnded}
            onPlay={async () => {
              if (!hasStartedPlaying) {
                setHasStartedPlaying(true);
                try {
                  await supabase.from("video_views").insert({
                    employee_id: employeeId,
                    video_id: assignments[0]?.video_id,
                    started_at: new Date().toISOString(),
                  });
                } catch (err) {
                  console.error("Error logging video start:", err);
                }
              }
            }}
            progressInterval={100}
            config={{
              file: {
                attributes: {
                  controlsList: "nodownload",
                  disablePictureInPicture: true,
                },
                forceAudio: false,
                forceHLS: false,
                forceVideo: false,
              },
            }}
          />
          {!hasStarted && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer"
              onClick={handleStart}>
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
                התחל צפייה
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-center items-center mt-4">
          <p className="text-2xl text-center mr-4 text-blue-500 font-bold">
            ברוכים הבאים למערכת {employeeName}
          </p>
        </div>
      </div>
      {getCurrentQuestionUI()}

      {isVideoEnded && isTestCompleted && (
        <Card className="mt-4 bg-green-50">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-green-600 mb-2">
              המבחן הושלם בהצלחה!
            </h2>
            <p className="text-gray-600">מעביר לדף הבקרה...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main page component with Suspense
export default function QuizPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizContent />
    </Suspense>
  );
}
