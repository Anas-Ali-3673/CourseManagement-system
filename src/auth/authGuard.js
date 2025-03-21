const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.generateToken = (payload) => {
  return jwt.sign({ ...payload, role: payload.role || 'student' }, JWT_SECRET, {
    expiresIn: '1h',
  });
};

exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'No token provided. Access denied.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Access denied.',
    });
  }
};
