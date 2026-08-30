import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {

  try {

    const question = req.body.message;

    if (!question) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const ollamaResponse = await fetch(
      "http://localhost:11434/api/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: "llama3.2",

          prompt: `
You are Aura AI.
Give accurate, clear and concise answers.
Answer directly.

User:
${question}
          `,

          stream: true,

          keep_alive: "10m"
        })
      }
    );

    if (!ollamaResponse.ok) {
      throw new Error(
        "Ollama request failed"
      );
    }

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    const reader =
      ollamaResponse.body.getReader();

    const decoder =
      new TextDecoder();

    let buffer = "";

    while (true) {

      const { done, value } =
        await reader.read();

      if (done) break;

      buffer += decoder.decode(
        value,
        {
          stream: true
        }
      );

      const lines =
        buffer.split("\n");

      buffer = lines.pop();

      for (const line of lines) {

        if (!line.trim()) {
          continue;
        }

        try {

          const data =
            JSON.parse(line);

          if (data.response) {
            res.write(
              data.response
            );
          }

        } catch (error) {

          console.error(
            "JSON parse error:",
            error
          );

        }
      }
    }

    if (buffer.trim()) {

      try {

        const data =
          JSON.parse(buffer);

        if (data.response) {
          res.write(
            data.response
          );
        }

      } catch (error) {

        console.error(
          "Final JSON parse error:",
          error
        );

      }
    }

    res.end();

  } catch (error) {

    console.error(
      "Aura AI error:",
      error
    );

    if (!res.headersSent) {

      res
        .status(500)
        .json({
          error:
            "Aura could not generate an answer."
        });

    } else {

      res.end();

    }
  }
});

app.listen(PORT, () => {

  console.log(
    `Aura AI running at http://localhost:${PORT}`
  );

});