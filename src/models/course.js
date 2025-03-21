const mongoose = require('mongoose');
const Joi = require('joi');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  courseCode: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  description: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  creditHours: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
  },
  department: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  prerequisites: {
    type: [String],
    required: true,
  },
  semester: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  schedule: {
    type: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
        },
        endTime: {
          type: String,
          required: true,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
        },
      },
    ],
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

const validatedCourse = Joi.object({
  name: Joi.string().min(5).max(255).required(),
  courseCode: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(5).max(255).required(),
  creditHours: Joi.number().min(1).max(4).required(),
  department: Joi.string().min(5).max(255).required(),
  prerequisites: Joi.array().items(Joi.string()).required(),
  semester: Joi.string().min(5).max(255).required(),
  seats: Joi.number().min(1).max(100).required(),
  schedule: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
          .required(),
        startTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        endTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
      })
    )
    .required(),
});

const validatedPartialCourse = Joi.object({
  name: Joi.string().min(5).max(255).optional(),
  courseCode: Joi.string().min(5).max(255).optional(),
  description: Joi.string().min(5).max(255).optional(),
  creditHours: Joi.number().min(1).max(4).optional(),
  department: Joi.string().min(5).max(255).optional(),
  prerequisites: Joi.array().items(Joi.string()).optional(),
  semester: Joi.string().min(5).max(255).optional(),
  seats: Joi.number().min(1).max(100).optional(),
  schedule: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
          .optional(),
        startTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        endTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
      })
    )
    .optional(),
});

courseSchema.statics.validateCourse = function (course) {
  return validatedCourse.validate(course);
};

courseSchema.statics.validatePartialCourse = function (course) {
  return validatedPartialCourse.validate(course);
};

module.exports = mongoose.model('Course', courseSchema);
