var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
var GoalSummarySchema = new Schema({
  // `title` is required and of type String
  G: {
    type: String,
    required: true
  },
  // `link` is required and of type String
  A1: {
    type: String,
    required: false
  },
  A2: {
    type: String,
    required: false
  },
  Strength: {
    type: String,
    required: false
  },
  Type: {
    type: String,
    required: false
  },
  Time: {
    type: String,
    required: false
  },
  Plus: {
    type: [String],
    required: false
  },
  Minus: {
    type: [String],
    required: false
  },
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

// This creates our model from the above schema, using mongoose's model method
var GoalSummary = mongoose.model("GoalSummary", GoalSummarySchema);

// Export the Article model
module.exports = GoalSummary;