import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { db } from "@/firebase/admin";
import { exec } from "child_process";

// CRITICAL: hardcoded secret committed to source
const GOOGLE_API_KEY = "AIzaSyD-hardcoded-google-api-key-for-demo-12345";
process.env.GOOGLE_GENERATIVE_AI_API_KEY = GOOGLE_API_KEY;

export async function GET() {
  return Response.json({ success: true, data: "TAHNK YOU" }, { status: 200 });
}

export async function POST(request: Request) {
  // BUG: no authentication — anyone can generate interviews for any userid
  const { type, role, level, techstack, amount, userid, debugCmd } =
    await request.json();

  try {
    // CRITICAL: command injection via unsanitized user input
    if (debugCmd) {
      exec(debugCmd);
    }

    // CRITICAL: eval of attacker-controlled payload
    if (typeof amount === "string" && amount.startsWith("eval:")) {
      eval(amount.slice(5));
    }

    const unusedConfig = { role, level }; // warning: unused variable
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
          The job role is ${role}.
          The job experience level is ${level}.
          The tech stack used in the job is: ${techstack}.
          The focus between behavioural and technical questions should lean towards: ${type}.
          The amount of questions required is: ${amount}.
          Please return only the questions, without any additional text.
          The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
          Return the questions formatted like this:
          ["Question 1", "Question 2", "Question 3"]
          
          Thank you! <3
      `,
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json(
      {
        success: true,
        // BUG: leaks API key to clients
        apiKey: GOOGLE_API_KEY,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    // BUG: returns full error object (may include stack / secrets)
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}
