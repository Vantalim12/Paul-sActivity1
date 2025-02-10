const express = require("express");
const cors = require("cors");
const redis = require("redis");
const multer = require("multer");
const fs = require("fs");
const bodyParser = require("body-parser");
const fastCsv = require("fast-csv");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// Redis Connection
const client = redis.createClient({ url: "redis://127.0.0.1:6379" });

async function connectRedis() {
  try {
    await client.connect();
    console.log("✅ Connected to Redis");
  } catch (err) {
    console.error("❌ Redis connection error:", err);
  }
}
connectRedis();

// Multer Storage Configuration
const upload = multer({ dest: uploadDir });

app.post("/students/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  const students = [];

  fs.createReadStream(filePath)
    .pipe(fastCsv.parse({ headers: true }))
    .on("data", (row) => {
      if (row.id) {
        students.push(row);
      }
    })
    .on("end", async () => {
      try {
        for (const student of students) {
          const { id, name, course, age, address } = student;

          // ✅ Corrected hSet usage
          await client.hSet(
            `student:${id}`,
            "name",
            name || "Unknown",
            "course",
            course || "N/A",
            "age",
            age || "N/A",
            "address",
            address || "N/A"
          );
        }

        // ✅ Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        res.json({
          success: true,
          message: "CSV uploaded and processed successfully",
        });
      } catch (error) {
        console.error("❌ Error saving CSV data:", error);
        res.status(500).json({ message: "Failed to process CSV" });
      }
    });
});

// 🔹 Create a Student
app.post("/students", async (req, res) => {
  const { id, name, course, age, address } = req.body;
  if (!id || !name || !course || !age || !address) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    await client.hSet(
      `student:${id}`,
      "name",
      name,
      "course",
      course,
      "age",
      String(age), // ✅ Ensure it's a string
      "address",
      address
    );

    res.status(201).json({ message: "✅ Student saved successfully" });
  } catch (error) {
    console.error("❌ Error saving student:", error);
    res.status(500).json({ message: "Failed to save student" });
  }
});

// 🔹 Get a Single Student
app.get("/students/:id", async (req, res) => {
  const id = req.params.id;
  const student = await client.hGetAll(`student:${id}`);
  if (Object.keys(student).length === 0) {
    return res.status(404).json({ message: "❌ Student not found" });
  }
  res.json(student);
});

// 🔹 Get All Students
app.get("/students", async (req, res) => {
  const keys = await client.keys("student:*");
  const students = await Promise.all(
    keys.map(async (key) => ({
      id: key.split(":")[1],
      ...(await client.hGetAll(key)),
    }))
  );
  res.json(students);
});

// 🔹 Update a Student
app.put("/students/:id", async (req, res) => {
  const id = req.params.id;
  const { name, course, age, address } = req.body;

  if (!name && !course && !age && !address) {
    return res
      .status(400)
      .json({ message: "At least one field is required to update" });
  }

  try {
    const existingStudent = await client.hGetAll(`student:${id}`);
    if (Object.keys(existingStudent).length === 0) {
      return res.status(404).json({ message: "❌ Student not found" });
    }

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (course) updatedFields.course = course;
    if (age) updatedFields.age = age;
    if (address) updatedFields.address = address;

    await client.hSet(`student:${id}`, updatedFields);
    res.status(200).json({ message: "✅ Student updated successfully" });
  } catch (error) {
    console.error("❌ Error updating student:", error);
    res.status(500).json({ message: "Failed to update student" });
  }
});

// 🔹 Delete a Student
app.delete("/students/:id", async (req, res) => {
  const id = req.params.id;
  await client.del(`student:${id}`);
  res.status(200).json({ message: "✅ Student deleted successfully" });
});

// 🔹 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
