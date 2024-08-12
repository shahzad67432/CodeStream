const express = require("express");
const { createClient } =  require("redis");
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors())

const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

app.post("/submit", async (req, res) => {
    const code = req.body.code;
    try {
        await client.lPush("problems", JSON.stringify({ code }));
        // Store in the database
        // prisma.problems.create({data: { code })
        res.status(200).send("Submission received and stored.");
    } catch (error) {
        console.error("Redis error:", error);
        res.status(500).send("Failed to store submission.");
    }
});

async function startServer() {
    try {
        await client.connect();
        console.log("Connected to Redis");

        app.listen(3002, () => {
            console.log("Server is running on port 3002");
        });
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}

startServer();