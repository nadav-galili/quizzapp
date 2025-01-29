"use client";
import React, { useState, useMemo, useEffect } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase/client";

interface Question {
  time: number;
  question: string;
  options: string[];
  answer: string;
}

const QuizPage = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [playing, setPlaying] = useState(true);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [questionsData, setQuestionsData] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState("");

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
        console.log("🚀 ~ fetchVideoData ~ employeeId:", employeeId);

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

  const handleAnswer = (answer: string) => {
    setUserAnswers((prev) => [...prev, answer]);
    setCurrentQuestionIndex(-1);
    setPlaying(true);
  };

  const handleEnded = () => {
    setIsVideoEnded(true);
    setPlaying(false);
  };

  const getCurrentQuestionUI = () => {
    if (currentQuestionIndex === -1) return null;

    const question = questions[currentQuestionIndex];
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
                className="w-full text-right"
                onClick={() => handleAnswer(option)}>
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getResults = () => {
    if (!isVideoEnded) return null;

    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <h3 className="text-lg font-bold mb-2">תוצאותך:</h3>
          <div className="space-y-2">
            {userAnswers.map((answer, index) => {
              const isCorrect = answer === questions[index].answer;
              return (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                  <p className="text-right">{questions[index].question}</p>
                  <p className="text-right">
                    תשובתך: {answer} {isCorrect ? "✓" : "✗"}
                  </p>
                </div>
              );
            })}
            <p className="font-bold mt-4">
              תוצאתך:{" "}
              {
                userAnswers.filter(
                  (answer, index) => answer === questions[index].answer
                ).length
              }
              /{questions.length}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="text-center p-8">טוען סרטון...</div>;
  if (videoError)
    return <div className="text-red-500 text-center p-8">{videoError}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end items-center">
        <p className="text-lg text-right mr-4 text-blue-500 font-bold">
          ברוכים הבאים למערכת {employeeName}
        </p>
      </div>
      <div className="relative aspect-video rounded-lg overflow-hidden">
        <ReactPlayer
          url={videoUrl}
          playing={playing}
          controls={true}
          width="100%"
          height="100%"
          onProgress={handleProgress}
          onEnded={handleEnded}
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
      </div>
      {getCurrentQuestionUI()}
      {getResults()}
    </div>
  );
};

export default QuizPage;
