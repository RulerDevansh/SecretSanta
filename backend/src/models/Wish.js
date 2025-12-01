const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    favoriteColor: {
      type: String,
      required: true,
    },
    favoriteSnacks: {
      type: String,
      required: true,
    },
    hobbies: {
      type: String,
      required: true,
    },
    thingsLove: {
      type: [String],
      default: [],
      validate: [(arr) => arr.length <= 3, 'Max 3 items'],
    },
    thingsNoNeed: {
      type: [String],
      default: [],
      validate: [(arr) => arr.length <= 3, 'Max 3 items'],
    },
    deliveredToSanta: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

wishSchema.index({ group: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Wish', wishSchema);
