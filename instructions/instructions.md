# Product Requirements Document (PRD)

## 1. Overview

We are building a multimedia questionnaire platform where users watch a video and answer multiple-choice questions at specific timestamps. After the video completes, the user sees their results, including which answers are correct or incorrect, and an overall score.

This web application will be built with Next 15, shadcn/ui, Tailwind, and TypeScript.
We will use ReactPlayer for video playback and control (pausing at specified times). The user must log in with an employee number to access the questionnaire.

## 2. Goals and Objectives

### 2.1 User Authentication (Minimal)

- A simple login page that asks for an employee number
- If the input is '1234', the user proceeds to the quiz. Otherwise, an error displays

### 2.2 Video Playback with Timed Questions

- Play a video from the public dir called 'video.mp4' using ReactPlayer
- Automatically pause at specific timestamps (1:36 min and 3:03 min) to display a multiple-choice question
- Resume playback after the user answers

### 2.3 Multiple-Choice Questionnaire

- Each question has 4 possible answers (some have only 2 answers in the example, but structurally we support up to 4)
- The user selects exactly one answer
- For each question, there is one correct answer

### 2.4 Results Display

- Once the video finishes, show the user's answers
- Correct answers highlighted in green
- Incorrect answers highlighted in red
- Display a final score (e.g., 2/2, 1/2, etc.)

### 2.5 Localization & Custom Text

- The example questions are in Hebrew, but the system should be flexible for other languages as needed

## 3. Core Functionalities

### 3.1 Login Flow

- Page: A single screen with an input field for "Employee Number" and a "Login" button
- If the number is "1234", route the user to the questionnaire page
- If not, show an error message ("Invalid employee number")

### 3.2 Video Questionnaire

- Displays an embedded video.js player with controls
- The user can click Play to start
- The video stops at the following timestamps:

#### First Question (1:36)

Question: "האם חובה להעביר את כל המוצרים בקופה אחד אחד?"

Options:

- א. כן
- ב. לא

Correct Answer: "ב. לא"

#### Second Question (3:03)

Question: "על מה צריך להקפיד ביציאה להפסקה?"

Options:

- א. נעילת הקופה
- ב. סגירת המעבר
- ג. הצבת שלט -קופה סגורה
- ד. כל התשובות נכונות

Correct Answer: "ד. כל התשובות נכונות"

- After each question is answered, the video resumes until the next stop (or end)

### 3.3 Result Page

- After the final timestamp question and video completion, the user is directed to or sees a results screen
- Each question's selected answer is displayed in green if correct or red if incorrect
- The final score is displayed (e.g., 2/2, 1/2, etc.)

## 4. File Structure

We aim for a minimal structure while using Next.js 15 (App Router) and shadcn/ui:

```
quizz
[├── README.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── app
│   ├── layout.tsx               # Root layout for Next.js (app router)
│   ├── globals.css              # Global styles (Tailwind, resets, etc.)
│   ├── page.tsx                 # (Optional) Could redirect to /login or display a root page
│   ├── login
│   │   └── page.tsx             # Login screen
│   ├── questionnaire
│   │   └── page.tsx             # Video quiz screen
│   └── results
│       └── page.tsx             # Results screen
├── components
│   ├── ui                       # shadcn UI components
│   │   └── button.tsx           # example shadcn/ui-based component
│   └── VideoQuiz.tsx            # Main logic for video.js + question logic
├── public
│   └── video.mp4                # The quiz video (if locally hosted)
└── instructions
    └── instructions.md          # Documentation, code snippets, references](instructions.md)
```

### Why This Structure

- The App Router (app/) organizes each route (login, questionnaire, results) in separate folders for clarity
- A single VideoQuiz.tsx component encapsulates the video.js logic, including time-based stops and question overlays
- The instructions/ folder can hold references, examples, or design documents
- shadcn/ui is integrated in components/ui for any reusable UI pieces (e.g., Buttons, Inputs)

## 5. Documentation & Reference Code

### 5.1 Using Video.js to Display Quiz and Stop at Timestamps

#### Important Context

The snippet below illustrates how we pause a video at certain times, display a question overlay, and resume after the user selects an answer. We'll adapt these concepts to the exact timestamps needed (1:36 and 3:03).

Note: We are not including final production code here, only an example from instructions.md.

Example Snippet (from instructions/instructions.md):

```javascript
import videojs from "video.js";

const player = videojs("my-video", {
  controls: true,
  autoplay: false,
  preload: "auto",
});

// Define the questions and their corresponding timestamps
const questions = [
  {
    time: 10, // Time in seconds to stop the video
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    answer: "Paris",
  },
  {
    time: 20,
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    answer: "4",
  },
];

// Function to display a question
function displayQuestion(question) {
  const questionContainer = document.getElementById("question-container");
  if (questionContainer) {
    questionContainer.innerHTML = `
      <h2>${question.question}</h2>
      <ul>
        ${question.options.map((option) => `<li>${option}</li>`).join("")}
      </ul>
    `;
  }
}

// Event listener for time updates
player.on("timeupdate", () => {
  const currentTime = player.currentTime();

  questions.forEach((q) => {
    if (currentTime >= q.time && !q.displayed) {
      player.pause(); // Pause the video
      displayQuestion(q); // Display the question
      q.displayed = true; // Mark question as displayed
    }
  });
});
```

#### Key Takeaways

1. On timeupdate, check if the current playback time has reached a question time
2. Pause the player, show question UI
3. After the user chooses an answer, resume playback

### 5.2 Handling Answers & Results

We define correct and incorrect answers. On final completion, a "results" page highlights correct answers in green and incorrect ones in red, along with a final score like 1/2 or 2/2.

## 6. Developer Alignment

### 6.1 Login

- Location: app/login/page.tsx
- Behavior: Check if employee number === '1234'; if true, route to /questionnaire; else show error

### 6.2 Questionnaire

- Location: app/questionnaire/page.tsx
- Logic:
  - Render the video using video.js
  - Stop at 1:36 and 3:03 to show questions
  - After each answer, continue playback

### 6.3 Results

- Location: app/results/page.tsx
- Displays:
  - Each question with user's selected answer in green if correct, red if incorrect
  - Score format (X/2)

### 6.4 UI & Styling

- Tailwind for quick styling
- shadcn/ui to build consistent design components

### 6.5 Data Handling

- Minimal storage needed. Answers can be kept in local state or passed around via Next's new server/client components
- No complex backend, unless required

### 6.6 User Flow

1. Landing → /login → user inputs employee#
2. If correct → /questionnaire. Video starts when user hits play
3. Video auto-pauses at 1:36 → first question. User picks an answer. Video resumes
4. Video auto-pauses at 3:03 → second question. User picks an answer. Resumes until end
5. After the video finishes or user transitions → /results to see final summary

## 7. Delivery & Timeline

- Phase 1: Basic scaffolding of Next.js app, Tailwind setup, and login page
- Phase 2: Integrate video.js with time-based question stops, store user answers
- Phase 3: Build results page with color-coded answers (correct/incorrect) and a final score
- Phase 4: Polish UI with shadcn/ui components, finalize error handling, QA testing

## 8. Additional Notes

- If the real application requires more questions or more timestamps, we can expand the approach
- For production video hosting, we may store the video in public/video.mp4 or a cloud solution (e.g., S3)
- If credentials or advanced authentication is needed, we can upgrade the "login" mechanism

## Summary

This document outlines the requirements for building a video-based quiz platform using Next 15, shadcn/ui, Tailwind, and TypeScript, along with video.js for playback. We have:

- Login → only accepts 1234
- Video that stops at 2 pre-defined times for Q&A
- Results summarizing correct/incorrect answers
- Minimal recommended file structure for clarity, referencing a single VideoQuiz component and separate route pages for login, questionnaire, and results

The attached documentation (including code snippets in instructions.md) provides the reference logic on how to pause the video at certain timestamps and show question overlays. Developers should follow the structure and flow described here to implement the final solution.
