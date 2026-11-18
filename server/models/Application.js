const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, trim: true, maxlength: 1000, default: '' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
}, { _id: false });

// Embedded interview invitation — stored directly on the application.
// Only one active invitation per application at a time.
const interviewSchema = new mongoose.Schema({
  scheduledAt:    { type: Date, required: true },
  mode:           { type: String, enum: ['online', 'offline'], required: true },
  meetingLink:    { type: String, trim: true, default: '' },
  venue:          { type: String, trim: true, default: '' },
  instructions:   { type: String, trim: true, maxlength: 1000, default: '' },
  // 'pending' → student hasn't responded yet
  // 'confirmed' → student confirmed attendance
  // 'reschedule_requested' → student asked to reschedule
  // 'rescheduled' → partner updated the schedule after student request
  invitationStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'reschedule_requested', 'rescheduled'],
    default: 'pending',
  },
  // Reschedule request from student
  rescheduleRequest: {
    preferredDate: { type: Date, default: null },
    reason:        { type: String, trim: true, maxlength: 500, default: '' },
    requestedAt:   { type: Date, default: null },
  },
  sentAt:    { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, trim: true, maxlength: 1800, default: '' },
  resumeData: { type: Buffer, default: null },
  resumeFilename: { type: String, default: '' },
  resumeMimetype: { type: String, default: '' },
  status: { type: String, enum: ['applied', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'in-progress', 'completed', 'selected'], default: 'applied' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  mentorNote: { type: String, trim: true, maxlength: 1000, default: '' },
  grade: { type: String, enum: ['', 'A+', 'A', 'B+', 'B', 'C', 'Incomplete'], default: '' },
  creditsAwarded: { type: Boolean, default: false },
  timeline: { type: [timelineSchema], default: [] },
  // Interview invitation — null until a partner schedules one
  interview: { type: interviewSchema, default: null },
}, { timestamps: true });

applicationSchema.index({ internship: 1, student: 1 }, { unique: true });
module.exports = mongoose.model('Application', applicationSchema);
