const Student = require('../models/student');
const { generateToken } = require('../auth/authGuard');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide email and password!',
    });
  }

  try {
    // Find admin with password
    const admin = await Student.findOne({ email, password }).exec();

    if (!admin) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: 'admin',
    });

    res.status(200).json({
      status: 'success',
      token,
      data: {
        admin,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};
