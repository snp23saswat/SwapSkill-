const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const offeredSkillSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mode: {
      type: String,
      enum: ['swap', 'paid', 'both'],
      required: true,
      default: 'swap',
    },
    hourlyRate: {
      type: Number,
      default: null,
      validate: {
        validator: function (v) {
          if (this.mode === 'paid' || this.mode === 'both') {
            return v !== null && v >= 50 && v <= 5000;
          }
          return v === null || v === undefined;
        },
        message: 'Hourly rate must be ₹50–₹5000 for paid/both modes, and null for swap-only.',
      },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default
    },
    bio: {
      type: String,
      default: '',
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      trim: true,
    },
    availability: {
      type: String,
      default: '',
      trim: true,
    },
    offered: {
      type: [offeredSkillSchema],
      default: [],
    },
    wanted: {
      type: [String],
      default: [],
    },
    sessionsCompleted: {
      type: Number,
      default: 0,
    },
    earnings: {
      totalReleased: {
        type: Number,
        default: 0,
      },
    },
    ratingAverage: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return public JSON (never include password)
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
