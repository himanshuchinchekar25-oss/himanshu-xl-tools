const path = require("path");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


dotenv.config({
  path: path.join(__dirname, ".env"),
});


const app = express();


const PORT =
  Number(process.env.PORT) || 3001;


const MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

  const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  "https://restless-shape-bea9.himanshuchinchekar25.workers.dev";


if (!process.env.GEMINI_API_KEY) {

  console.error(
    "GEMINI_API_KEY is missing in server/.env"
  );

  process.exit(1);

}


const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  encodeURIComponent(MODEL) +
  ":generateContent";

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}


async function callGeminiWithRetry(requestOptions) {

  const models = [
    MODEL,
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite"
  ];

  const maxAttemptsPerModel = 3;

  let lastError = null;


  for (const model of models) {

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(model) +
      ":generateContent";


    for (
      let attempt = 1;
      attempt <= maxAttemptsPerModel;
      attempt++
    ) {

      try {

        const response =
          await fetch(
            apiUrl,
            requestOptions
          );


        const data =
          await response.json();


        if (response.ok) {

          return {
            response: response,
            data: data,
            model: model
          };

        }


        const status =
          response.status;


        const apiMessage =
          data &&
          data.error &&
          data.error.message
            ? data.error.message
            : "Gemini API request failed.";


        const retryable =
          status === 408 ||
          status === 429 ||
          status >= 500;


        if (!retryable) {

          throw new Error(
            apiMessage
          );

        }


        lastError =
          new Error(
            apiMessage
          );


        if (
          attempt <
          maxAttemptsPerModel
        ) {

          const delayMs =
            Math.pow(
              2,
              attempt - 1
            ) * 1000;


          console.warn(
            "Gemini transient error:",
            status,
            "model:",
            model,
            "attempt:",
            attempt,
            "retrying in:",
            delayMs,
            "ms"
          );


          await sleep(
            delayMs
          );

        }

      } catch (error) {

        lastError =
          error;


        if (
          attempt >=
          maxAttemptsPerModel
        ) {

          break;

        }


        const delayMs =
          Math.pow(
            2,
            attempt - 1
          ) * 1000;


        await sleep(
          delayMs
        );

      }

    }


    console.warn(
      "Gemini model fallback:",
      model
    );

  }


  throw (
    lastError ||
    new Error(
      "All Gemini models failed."
    )
  );

}


app.use(
  cors({
    origin: function (origin, callback) {

      const allowedOrigins = [
        "https://localhost:3000",
        FRONTEND_ORIGIN,
      ];

      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {

        return callback(
          null,
          true
        );

      }

      return callback(
        new Error(
          "Origin is not allowed by CORS."
        )
      );

    },

    methods: [
      "GET",
      "POST",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
    ],
  })
);


app.use(
  express.json({
    limit: "1mb",
  })
);


// =========================================
// HEALTH CHECK
// =========================================

app.get(
  "/health",

  function (req, res) {

    res.json({
      success: true,
      service:
        "Himanshu XL Tools AI Backend",
      model:
        MODEL,
    });

  }
);


// =========================================
// AI FORMULA GENERATOR
// =========================================

app.post(
  "/api/ai/formula",

  async function (req, res) {

    try {

      const prompt =
        String(
          req.body.prompt || ""
        ).trim();


      const selection =
        req.body.selection || {};


      if (!prompt) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Formula request is required.",
          });

      }


      const workbookContext = {
        sheetName:
          selection.sheetName || "",

        address:
          selection.address || "",

        rowIndex:
          selection.rowIndex,

        columnIndex:
          selection.columnIndex,

        rowCount:
          selection.rowCount,

        columnCount:
          selection.columnCount,

        values:
          Array.isArray(
            selection.values
          )
            ? selection.values
            : [],

        formulas:
          Array.isArray(
            selection.formulas
          )
            ? selection.formulas
            : [],
      };


            const instructionText =
        [
          "You generate Microsoft Excel formulas.",
          "Return valid JSON only.",
          "Do not use Markdown code fences.",
          "The JSON must contain exactly two string fields: formula and explanation.",
          "formula must start with =.",
          "Use Excel-compatible functions and references.",
          "Use the supplied worksheet selection as context.",
          "Do not invent workbook columns or ranges that are not supported by the supplied context.",
          "Keep explanation concise."
        ].join(" ");


      const geminiResponse =
        await fetch(
          GEMINI_API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                process.env.GEMINI_API_KEY
            },

            body:
              JSON.stringify({
                contents: [
                  {
                    role: "user",

                    parts: [
                      {
                        text:
                          instructionText +
                          "\n\nRequest:\n" +
                          prompt +
                          "\n\nExcel selection:\n" +
                          JSON.stringify(
                            workbookContext
                          )
                      }
                    ]
                  }
                ],

                generationConfig: {
                  responseMimeType:
                    "application/json"
                }
              })
          }
        );


      const geminiData =
        await geminiResponse.json();


      if (!geminiResponse.ok) {

        const apiMessage =
          geminiData &&
          geminiData.error &&
          geminiData.error.message
            ? geminiData.error.message
            : "Gemini API request failed.";


        throw new Error(
          apiMessage
        );

      }


      const rawText =
        String(
          geminiData &&
          geminiData.candidates &&
          geminiData.candidates[0] &&
          geminiData.candidates[0].content &&
          geminiData.candidates[0].content.parts &&
          geminiData.candidates[0].content.parts[0] &&
          geminiData.candidates[0].content.parts[0].text
            ? geminiData.candidates[0].content.parts[0].text
            : ""
        ).trim();

      if (!rawText) {

        throw new Error(
          "Gemini returned an empty response."
        );

      }


      let parsed;


      try {

        parsed =
          JSON.parse(rawText);

      } catch (parseError) {

        console.error(
          "AI Formula JSON parse error:",
          rawText
        );


        throw new Error(
          "AI returned an invalid formula response."
        );

      }


      const formula =
        String(
          parsed.formula || ""
        ).trim();


      const explanation =
        String(
          parsed.explanation || ""
        ).trim();


      if (
        !formula ||
        formula.charAt(0) !== "="
      ) {

        throw new Error(
          "AI did not return a valid Excel formula."
        );

      }


      return res.json({

        success:
          true,

        formula:
          formula,

        explanation:
          explanation ||
          "Formula generated successfully.",

      });

    } catch (error) {

      console.error(
        "AI Formula Backend Error:",
        error
      );


      const message =
        error &&
        error.message
          ? error.message
          : String(error);


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            message,

        });

    }

  }
);

// =========================================
// EXPLAIN FORMULA
// =========================================

app.post(
  "/api/ai/explain-formula",

  async function (req, res) {

    try {

      const selection =
        req.body.selection || {};


      const formula =
        String(
          selection.formula || ""
        ).trim();


      if (
        !formula ||
        formula.charAt(0) !== "="
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "A valid Excel formula is required."

          });

      }


      const formulaContext = {

        sheetName:
          selection.sheetName || "",

        address:
          selection.address || "",

        formula:
          formula,

        value:
          selection.value

      };


      const instructionText =
        [
          "You explain Microsoft Excel formulas.",
          "Return valid JSON only.",
          "Do not use Markdown code fences.",
          "The JSON must contain exactly one string field named explanation.",
          "Explain the formula in clear, simple language.",
          "Explain important functions, references, operators, and logic.",
          "Mention what the formula is trying to calculate.",
          "Do not rewrite or modify the formula.",
          "Keep the explanation concise but useful."
        ].join(" ");


      const geminiResponse =
        await fetch(
          GEMINI_API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                process.env.GEMINI_API_KEY
            },

            body:
              JSON.stringify({

                contents: [
                  {
                    role: "user",

                    parts: [
                      {
                        text:
                          instructionText +
                          "\n\nExcel formula context:\n" +
                          JSON.stringify(
                            formulaContext
                          )
                      }
                    ]
                  }
                ],

                generationConfig: {
                  responseMimeType:
                    "application/json"
                }

              })
          }
        );


      const geminiData =
        await geminiResponse.json();


      if (!geminiResponse.ok) {

        const apiMessage =
          geminiData &&
          geminiData.error &&
          geminiData.error.message
            ? geminiData.error.message
            : "Gemini Explain Formula request failed.";


        throw new Error(
          apiMessage
        );

      }


      const rawText =
        String(
          geminiData &&
          geminiData.candidates &&
          geminiData.candidates[0] &&
          geminiData.candidates[0].content &&
          geminiData.candidates[0].content.parts &&
          geminiData.candidates[0].content.parts[0] &&
          geminiData.candidates[0].content.parts[0].text
            ? geminiData.candidates[0].content.parts[0].text
            : ""
        ).trim();


      if (!rawText) {

        throw new Error(
          "Gemini returned an empty formula explanation."
        );

      }


      let parsed;


      try {

        parsed =
          JSON.parse(
            rawText
          );

      } catch (parseError) {

        console.error(
          "Explain Formula JSON parse error:",
          rawText
        );


        throw new Error(
          "Gemini returned an invalid Explain Formula response."
        );

      }


      const explanation =
        String(
          parsed.explanation || ""
        ).trim();


      if (!explanation) {

        throw new Error(
          "Gemini did not return a formula explanation."
        );

      }


      return res.json({

        success:
          true,

        explanation:
          explanation

      });

    } catch (error) {

      console.error(
        "Explain Formula Backend Error:",
        error
      );


      const message =
        error &&
        error.message
          ? error.message
          : String(error);


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            message

        });

    }

  }
);

// =========================================
// FIX FORMULA
// =========================================

app.post(
  "/api/ai/fix-formula",

  async function (req, res) {

    try {

      const selection =
        req.body.selection || {};


      const formula =
        String(
          selection.formula || ""
        ).trim();


      if (
        !formula ||
        formula.charAt(0) !== "="
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "A valid Excel formula is required."

          });

      }


      const formulaContext = {

        sheetName:
          selection.sheetName || "",

        address:
          selection.address || "",

        formula:
          formula,

        value:
          selection.value

      };


      const instructionText =
        [
          "You diagnose and correct Microsoft Excel formulas.",
          "Return valid JSON only.",
          "Do not use Markdown code fences.",
          "The JSON must contain exactly two string fields: problem and fixedFormula.",
          "fixedFormula must start with =.",
          "Preserve the user's intended calculation whenever it can be inferred from the supplied formula.",
          "Correct syntax errors, invalid function structure, missing parentheses, invalid operators, and obvious reference mistakes.",
          "Do not invent unrelated worksheet ranges or columns.",
          "If the formula is already valid, return the same formula as fixedFormula and explain that no correction was necessary.",
          "Keep problem concise and useful."
        ].join(" ");


      const geminiResponse =
        await fetch(
          GEMINI_API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                process.env.GEMINI_API_KEY
            },

            body:
              JSON.stringify({

                contents: [
                  {
                    role: "user",

                    parts: [
                      {
                        text:
                          instructionText +
                          "\n\nExcel formula context:\n" +
                          JSON.stringify(
                            formulaContext
                          )
                      }
                    ]
                  }
                ],

                generationConfig: {
                  responseMimeType:
                    "application/json"
                }

              })
          }
        );


      const geminiData =
        await geminiResponse.json();


      if (!geminiResponse.ok) {

        const apiMessage =
          geminiData &&
          geminiData.error &&
          geminiData.error.message
            ? geminiData.error.message
            : "Gemini Fix Formula request failed.";


        throw new Error(
          apiMessage
        );

      }


      const rawText =
        String(
          geminiData &&
          geminiData.candidates &&
          geminiData.candidates[0] &&
          geminiData.candidates[0].content &&
          geminiData.candidates[0].content.parts &&
          geminiData.candidates[0].content.parts[0] &&
          geminiData.candidates[0].content.parts[0].text
            ? geminiData.candidates[0].content.parts[0].text
            : ""
        ).trim();


      if (!rawText) {

        throw new Error(
          "Gemini returned an empty Fix Formula response."
        );

      }


      let parsed;


      try {

        parsed =
          JSON.parse(
            rawText
          );

      } catch (parseError) {

        console.error(
          "Fix Formula JSON parse error:",
          rawText
        );


        throw new Error(
          "Gemini returned an invalid Fix Formula response."
        );

      }


      const problem =
        String(
          parsed.problem || ""
        ).trim();


      const fixedFormula =
        String(
          parsed.fixedFormula || ""
        ).trim();


      if (
        !fixedFormula ||
        fixedFormula.charAt(0) !== "="
      ) {

        throw new Error(
          "Gemini did not return a valid corrected Excel formula."
        );

      }


      return res.json({

        success:
          true,

        problem:
          problem ||
          "Formula analyzed successfully.",

        fixedFormula:
          fixedFormula

      });

    } catch (error) {

      console.error(
        "Fix Formula Backend Error:",
        error
      );


      const message =
        error &&
        error.message
          ? error.message
          : String(error);


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            message

        });

    }

  }
);


// =========================================
// AI ANALYSIS
// =========================================

app.post(
  "/api/ai/analysis",

  async function (req, res) {

    try {

      const selection =
        req.body.selection || {};


      const values =
        Array.isArray(selection.values)
          ? selection.values
          : [];


      if (
        !values.length ||
        !Array.isArray(values[0]) ||
        !values[0].length
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "A valid Excel range is required for AI Analysis."

          });

      }


      const rowCount =
        Number(selection.rowCount) ||
        values.length;


      const columnCount =
        Number(selection.columnCount) ||
        (
          Array.isArray(values[0])
            ? values[0].length
            : 0
        );


      const analysisContext = {

        sheetName:
          selection.sheetName || "",

        address:
          selection.address || "",

        rowIndex:
          selection.rowIndex,

        columnIndex:
          selection.columnIndex,

        rowCount:
          rowCount,

        columnCount:
          columnCount,

        values:
          values

      };


      const instructionText =
        [
          "You are an AI data analyst for Microsoft Excel.",
          "Analyze the supplied Excel range.",
          "Return valid JSON only.",
          "Do not use Markdown code fences.",
          "The JSON must contain exactly one string field named analysis.",
          "Give useful insights based only on the supplied data.",
          "Identify important patterns, trends, totals, comparisons, unusual values, or possible data-quality issues when supported by the data.",
          "Do not invent columns, values, facts, trends, or conclusions that are not supported by the supplied Excel range.",
          "If the first row appears to contain headers, use those headers when explaining the data.",
          "If the range is too small or insufficient for a meaningful conclusion, clearly say so.",
          "Use clear and concise business language.",
          "Keep the analysis useful for an Excel user."
        ].join(" ");


      const geminiResponse =
        await fetch(
          GEMINI_API_URL,
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "x-goog-api-key":
                process.env.GEMINI_API_KEY

            },

            body:
              JSON.stringify({

                contents: [
                  {

                    role: "user",

                    parts: [
                      {

                        text:
                          instructionText +
                          "\n\nExcel range context:\n" +
                          JSON.stringify(
                            analysisContext
                          )

                      }
                    ]

                  }
                ],

                generationConfig: {

                  responseMimeType:
                    "application/json"

                }

              })

          }
        );


      const geminiData =
        await geminiResponse.json();


      if (!geminiResponse.ok) {

        const apiMessage =
          geminiData &&
          geminiData.error &&
          geminiData.error.message
            ? geminiData.error.message
            : "Gemini AI Analysis request failed.";


        throw new Error(
          apiMessage
        );

      }


      const rawText =
        String(
          geminiData &&
          geminiData.candidates &&
          geminiData.candidates[0] &&
          geminiData.candidates[0].content &&
          geminiData.candidates[0].content.parts &&
          geminiData.candidates[0].content.parts[0] &&
          geminiData.candidates[0].content.parts[0].text
            ? geminiData.candidates[0].content.parts[0].text
            : ""
        ).trim();


      if (!rawText) {

        throw new Error(
          "Gemini returned an empty AI Analysis response."
        );

      }


      let parsed;


      try {

        parsed =
          JSON.parse(
            rawText
          );

      } catch (parseError) {

        console.error(
          "AI Analysis JSON parse error:",
          rawText
        );


        throw new Error(
          "Gemini returned an invalid AI Analysis response."
        );

      }


      const analysis =
        String(
          parsed.analysis || ""
        ).trim();


      if (!analysis) {

        throw new Error(
          "Gemini did not return an AI analysis."
        );

      }


      return res.json({

        success:
          true,

        analysis:
          analysis

      });


    } catch (error) {

      console.error(
        "AI Analysis Backend Error:",
        error
      );


      const message =
        error &&
        error.message
          ? error.message
          : String(error);


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            message

        });

    }

  }
);


// =========================================
// START SERVER
// =========================================

app.listen(
  PORT,
  "0.0.0.0",
  function () {

    console.log(
      "Himanshu XL Tools AI Backend running on port " +
      PORT
    );

    console.log(
      "Gemini model:",
      MODEL
    );

    console.log(
      "Frontend origin:",
      FRONTEND_ORIGIN
    );

  }
);