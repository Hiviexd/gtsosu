const mongoose = require("mongoose");

const Tournament = new mongoose.Schema({
  code: String,
  registrationOpen: Boolean,
  teams: Boolean,
  stages: [
    {
      name: String,
      poolVisible: Boolean,
      mappack: String,
    },
  ],
});

module.exports = mongoose.model("Tournament", Tournament);
