const mongoose = require('mongoose');

const sessionRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['swap', 'paid'],
      required: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // --- SWAP fields ---
    skillTeachByInitiator: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    skillTeachByReceiver: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },

    // --- PAID fields ---
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    skill: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    durationMinutes: {
      type: Number,
      enum: [30, 60, 90],
      default: null,
    },
    ratePerHourSnapshot: {
      type: Number,
      default: null,
    },
    price: {
      type: Number,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'held', 'released', 'refunded'],
      default: 'unpaid',
    },
    paymentRef: {
      type: String,
      default: '',
    },

    // --- Common fields ---
    message: {
      type: String,
      default: '',
      maxlength: [300, 'Message cannot exceed 300 characters'],
      trim: true,
    },
    proposedSlots: {
      type: [Date],
      validate: {
        validator: function (v) {
          return v.length >= 1 && v.length <= 3;
        },
        message: 'Provide 1 to 3 proposed time slots.',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient query of user's requests
sessionRequestSchema.index({ initiatedBy: 1, status: 1 });
sessionRequestSchema.index({ receiver: 1, status: 1 });
sessionRequestSchema.index({ teacher: 1, paymentStatus: 1 });
sessionRequestSchema.index({ learner: 1, paymentStatus: 1 });

module.exports = mongoose.model('SessionRequest', sessionRequestSchema);
