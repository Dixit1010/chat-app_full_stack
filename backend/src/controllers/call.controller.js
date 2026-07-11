import CallLog from "../models/call.model.js";

export const saveCallLog = async (req, res, next) => {
  try {
    const { calleeId, duration } = req.body;
    const callerId = req.user._id;
    
    const log = await CallLog.create({
      callerId,
      calleeId,
      duration,
      timestamp: new Date()
    });
    
    res.status(201).json(log);
  } catch (error) {
    console.error("Error saving call log", error);
    next(error);
  }
};
