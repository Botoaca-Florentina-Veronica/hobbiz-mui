const mongoose = require('mongoose');

const messageReportSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    messageSnippet: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'abusive', 'harassment', 'inappropriate', 'other'],
      required: true,
      default: 'other',
    },
    details: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

messageReportSchema.index({ reporter: 1, message: 1, status: 1 });
messageReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MessageReport', messageReportSchema);
