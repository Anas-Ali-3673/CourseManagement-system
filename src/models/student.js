const mongoose = require('mongoose');
const Joi = require('joi');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  rollNo: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  department: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  semester: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  completedCourses: {
    type: [String],
    required: true,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const validatedStudent = Joi.object({
  name: Joi.string().min(5).max(255).required(),
  email: Joi.string().min(5).max(255).required(),
  rollNo: Joi.string().min(5).max(255).required(),
  department: Joi.string().min(5).max(255).required(),
  semester: Joi.string().min(5).max(255).required(),
  completedCourses: Joi.array().items(Joi.string()).required(),
});

const validatedPartialStudent = Joi.object({
  name: Joi.string().min(5).max(255).optional(),
  email: Joi.string().min(5).max(255).optional(),
  rollNo: Joi.string().min(5).max(255).optional(),
  department: Joi.string().min(5).max(255).optional(),
  semester: Joi.string().min(5).max(255).optional(),
  completedCourses: Joi.array().items(Joi.string()).optional(),
});

studentSchema.statics.validatePartialStudent = function (student) {
  return validatedPartialStudent.validate(student);
};

studentSchema.statics.validateStudent = function (student) {
  return validatedStudent.validate(student);
};

module.exports = mongoose.model('Student', studentSchema);
