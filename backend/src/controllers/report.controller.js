import Report from "../models/report.model.js";
import { reportSchema } from "../lib/validation.js";

export const submitReport = async (req, res, next) => {
  try {
    const validatedData = reportSchema.parse(req.body);
    const reporterId = req.user._id;

    const newReport = new Report({
      reporterId,
      ...validatedData,
    });

    await newReport.save();

    res.status(201).json({ message: "Report submitted successfully" });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: error.issues[0].message });
    }
    next(error);
  }
};
