const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

const timeSlotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  hr_id: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  candidate_name: { type: String, default: null },
  interview_type: { type: String, default: null },
});

const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);

app.get("/timeslots", async (req, res) => {
  const { hr_id } = req.query;
  try {
    const timeSlots = await TimeSlot.find({ hr_id });
    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/timeslots", async (req, res) => {
  const { hr_id, start_time, end_time, candidate_name, interview_type } = req.body;

  try {
    const conflicts = await TimeSlot.findOne({
      hr_id,
      $or: [
        { start_time: { $lt: new Date(end_time) }, end_time: { $gt: new Date(start_time) } },
      ],
    });

    if (conflicts) {
      return res.status(400).json({ error: "Time slot conflicts with an existing slot" });
    }

    const newSlot = new TimeSlot({
      id: uuidv4(),
      hr_id,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      candidate_name,
      interview_type,
    });

    await newSlot.save();
    res.status(201).json(newSlot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/timeslots/:id", async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, candidate_name, interview_type } = req.body;

  try {
    const updatedSlot = await TimeSlot.findOneAndUpdate(
      { id },
      { start_time: new Date(start_time), end_time: new Date(end_time), candidate_name, interview_type },
      { new: true }
    );

    if (!updatedSlot) {
      return res.status(404).json({ error: "Time slot not found" });
    }

    res.json(updatedSlot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/timeslots/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSlot = await TimeSlot.findOneAndDelete({ id });
    if (!deletedSlot) {
      return res.status(404).json({ error: "Time slot not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
