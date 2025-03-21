const connectDB = require('./src/config/db');
const express = require('express');
const CORS = require('cors');
const app = express();
const CourseRouter = require('./src/routers/course');
const StudentRouter = require('./src/routers/student');
const AuthRouter = require('./src/routers/auth');
const EnrollermentRouter = require('./src/routers/enrollment');
connectDB();

// Update your CORS configuration to be more permissive for development
app.use(
  CORS({
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use('/api/courses', CourseRouter);
app.use('/api/students', StudentRouter);
app.use('/api/auth', AuthRouter);
app.use('/api/enrollments', EnrollermentRouter);

app.get('/', (req, res) => {
  res.send('API is running...');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
