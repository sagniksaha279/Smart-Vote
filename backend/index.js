require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio Client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database Connection with Better Error Handling
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Test DB Connection
db.connect(err => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    } else {
        console.log("✅ Connected to SmartVote Database!");
    }
});

// Login API
app.post('/login', async (req, res) => {
  const { eval_id, username, password } = req.body;

  const [rows] = await db.query(
    "SELECT * FROM evalDetails WHERE eval_id = ? AND username = ? AND password = ?",
    [eval_id, username, password]
  );

  if (rows.length > 0) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "❌ Invalid Evaluator ID, Username or Password" });
  }
});

// Check EPIC API
app.post("/check-epic", (req, res) => {
    const { EPIC_no } = req.body;
    if (!EPIC_no) {
        return res.status(400).json({ success: false, message: "❌ EPIC number is required" });
    }

    db.query("SELECT name, FatherName, voted, city, phoneNumber FROM details WHERE EPIC_no = ?", [EPIC_no], (err, results) => {
        if (err) {
            console.error("❌ Error executing query:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "❌ EPIC number not found" });
        }

        const user = results[0];

        if (user.voted) {
            return res.json({
                success: false,
                alreadyVoted: true, 
                message: "⚠️ This person has already voted! Voting again is not allowed."
            });
        }

        // Send SMS Notification before updating the database
        let smsPromise = Promise.resolve();

        if (user.phoneNumber) {
            const messageBody = `Dear ${user.name}, your vote has been successfully registered in ${user.city}. Thank you for participating in Voting!🗳️`;

            smsPromise = twilioClient.messages.create({
                body: messageBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.phoneNumber
            }).then(() => {
                console.log("📩 SMS sent successfully to", user.phoneNumber);
            }).catch(smsErr => {
                console.error("❌ Error sending SMS:", smsErr);
            });
        }

        smsPromise.finally(() => {
            db.query("UPDATE details SET voted = TRUE WHERE EPIC_no = ?", [EPIC_no], (updateErr) => {
                if (updateErr) {
                    console.error("❌ Error updating voted status:", updateErr);
                    return res.status(500).json({ success: false, message: "Error updating vote status" });
                }

                res.json({
                    success: true,
                    name: user.name,   
                    father_name: user.FatherName,  
                    city: user.city,
                    phoneNumber: user.phoneNumber,
                    message: "🗳️ Vote Registered Successfully! SMS notification sent."
                });
            });
        });
    });
});

// Feedback API
app.post("/submit-feedback", (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Feedback cannot be empty" });
    }

    db.query("INSERT INTO feedback (message) VALUES (?)", [message], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.status(201).json({ message: "Thank you for sending us feedback!" });
    });
});

// Root Route
app.get("/", (req, res) => {
    res.send("✅ SmartVote Backend is Running!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
