import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

const InterviewScheduler = () => {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const availableSlots = [
    { start: "15:00", end: "15:30" },
    { start: "15:30", end: "16:00" },
    { start: "16:00", end: "16:30" },
    { start: "16:30", end: "17:00" },
  ];

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch("http://localhost:5000/timeslots?hr_id=current_hr_id");
      const data = await response.json();

      const formattedEvents = data.map((slot) => ({
        id: slot.id,
        title: slot.candidate_name || "Available Slot",
        start: new Date(slot.start_time),
        end: new Date(slot.end_time),
        type: slot.interview_type,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching time slots", error);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedSlot) {
      alert("Please select a date and time slot.");
      return;
    }

    const selectedStartTime = new Date(selectedDate);
    const selectedEndTime = new Date(selectedDate);

    const [startHour, startMinute] = selectedSlot.start.split(":").map(Number);
    const [endHour, endMinute] = selectedSlot.end.split(":").map(Number);

    selectedStartTime.setHours(startHour, startMinute);
    selectedEndTime.setHours(endHour, endMinute);

    const newTimeSlot = {
      hr_id: "current_hr_id",
      start_time: selectedStartTime.toISOString(),
      end_time: selectedEndTime.toISOString(),
      candidate_name: e.target.candidateName.value,
      interview_type: e.target.interviewType.value,
    };

    try {
      const response = await fetch("http://localhost:5000/timeslots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTimeSlot),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create time slot");
      }

      await fetchTimeSlots();
      setIsModalOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const renderCalendar = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleDateClick(new Date(2025, 0, day))}
            className="p-2 bg-gray-200 rounded hover:bg-blue-300"
          >
            {day}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center mb-4">
        <Calendar className="mr-2" /> Interview Scheduler
      </h1>
      {renderCalendar()}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4">Schedule Interview</h2>
            <form onSubmit={handleSlotSubmit}>
              <div className="mb-4">
                <label className="block mb-2">Selected Date</label>
                <input
                  type="text"
                  value={selectedDate?.toDateString()}
                  className="w-full border p-2 rounded"
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Select Time Slot</label>
                <select
                  onChange={(e) => setSelectedSlot(JSON.parse(e.target.value))}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">-- Select Slot --</option>
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={JSON.stringify(slot)}>
                      {slot.start} - {slot.end}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2">Candidate Name</label>
                <input
                  type="text"
                  name="candidateName"
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Interview Type</label>
                <select name="interviewType" className="w-full border p-2 rounded" required>
                  <option value="Technical">Technical</option>
                  <option value="HR">HR</option>
                  <option value="Final Round">Final Round</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScheduler;
