const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config({ path: __dirname + "/.env" });

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const client = new MongoClient(process.env.MONGODB_URI);

let tasksCollection;

async function connectDB() {
    try {
        await client.connect();

        const db = client.db("cloudTaskManager");

        tasksCollection = db.collection("tasks");

        console.log("MongoDB Atlas connected successfully!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}


// TEST ROUTE
app.get("/", (req, res) => {
    res.send("Cloud Task Manager Backend Running");
});


// GET TASKS FOR A USER
app.get("/api/tasks/:uid", async (req, res) => {
    try {
        const tasks = await tasksCollection
            .find({ uid: req.params.uid })
            .toArray();

        res.json(tasks);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});


// ADD TASK
app.post("/api/tasks", async (req, res) => {
    try {
        const result = await tasksCollection.insertOne(req.body);

        res.json({
            message: "Task added successfully",
            id: result.insertedId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add task" });
    }
});


// UPDATE TASK
app.put("/api/tasks/:id", async (req, res) => {
    try {
        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        res.json({
            message: "Task updated successfully",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update task" });
    }
});


// DELETE TASK
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const result = await tasksCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        });

        res.json({
            message: "Task deleted successfully",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete task" });
    }
});


connectDB().then(() => {

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

});