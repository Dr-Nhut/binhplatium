const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    missing: {
      type: Boolean,
      required: true,
      default: false,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
    last_position: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: false,
    },
    last_center: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: false,
    },
  },
  { _id: false }
);

const deviceCheckSchema = new mongoose.Schema({
  devices: {
    type: [deviceSchema],
    required: true,
  },
  checkedAt: {
    type: Date,
    default: Date.now,
  },
});

const DeviceCheck = mongoose.model("DeviceCheck", deviceCheckSchema);

module.exports = DeviceCheck;
