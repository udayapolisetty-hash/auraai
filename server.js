import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("."));

app.get("/", (req, res) => {
  res.sendFile("aura.html", {
    root: process.cwd()
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const question = req.body.message;

    if (!question) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are Aura AI.

Give accurate, current, clear and concise answers.
Answer directly and naturally.

User:
${question}
                  `
                }
              ]
            }
          ]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText =
        await geminiResponse.text();

      console.error(
        "Gemini API error:",
        errorText
      );

      throw new Error(
        "Gemini request failed"
      );
    }

    const data =
      await geminiResponse.json();

    const answer =
      data?.candidates?.[0]
        ?.content?.parts
        ?.map(part => part.text || "")
        .join("");

    if (!answer) {
      throw new Error(
        "Gemini returned no answer"
      );
    }

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.send(answer);

  } catch (error) {
    console.error(
      "Aura AI error:",
      error
    );

    res.status(500).json({
      error:
        "Aura could not generate an answer."
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Aura AI running at http://localhost:${PORT}`
  );
});