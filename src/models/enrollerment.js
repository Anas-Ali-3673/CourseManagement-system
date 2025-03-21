const mongoose = require('mongoose');
const Joi = require('joi');
const enrollermentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const validatedEnrollerment = Joi.object({
  student: Joi.string().required(),
  course: Joi.string().required(),
});

enrollermentSchema.statics.validate = function (enrollerment) {
  return validatedEnrollerment.validate(enrollerment);
};
module.exports = mongoose.model('Enrollerment', enrollermentSchema);
