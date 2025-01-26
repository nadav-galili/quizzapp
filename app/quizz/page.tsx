"use client";
import React, { useState, useMemo } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const questions: Question[] = useMemo(
    () => [
      {
        time: 96, // 1:36 in seconds
        question: "האם חובה להעביר את כל המוצרים בקופה אחד אחד?",
        options: ["א. כן", "ב. לא"],
        answer: "ב. לא",
      },
      {
        time: 183, // 3:03 in seconds
        question: "על מה צריך להקפיד ביציאה להפסקה?",
        options: [
          "א. נעילת הקופה",
          "ב. סגירת המעבר",
          "ג. הצבת שלט -קופה סגורה",
          "ד. כל התשובות נכונות",
        ],
        answer: "ד. כל התשובות נכונות",
      },
    ],
    []
  );

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

  return (
    <div className="container mx-auto p-4">
      <div className="relative aspect-video rounded-lg overflow-hidden">
        <ReactPlayer
          url="/video.mp4"
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
