import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-metaverse-key-123';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus';

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Database Initialization
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const classSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  course: { type: String, required: true },
  faculty: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'live' }
});
const Class = mongoose.model('Class', classSchema);

const announcementSchema = new mongoose.Schema({
  text: { type: String, required: true },
  date: { type: String, required: true }
});
announcementSchema.set('toJSON', { virtuals: true });
const Announcement = mongoose.model('Announcement', announcementSchema);

const timetableSchema = new mongoose.Schema({
  course: { type: String, required: true },
  faculty: { type: String, required: true },
  time: { type: String, required: true }
});
timetableSchema.set('toJSON', { virtuals: true });
const Timetable = mongoose.model('Timetable', timetableSchema);

const feedbackSchema = new mongoose.Schema({
  text: { type: String, required: true },
  rating: { type: Number, required: true }
});
feedbackSchema.set('toJSON', { virtuals: true });
const Feedback = mongoose.model('Feedback', feedbackSchema);

const testSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  faculty: { type: String, required: true },
  questions: { type: Array, required: true }, 
  answers: { type: Array, required: true },
  status: { type: String, default: 'active' }
});
const Test = mongoose.model('Test', testSchema);

const testResultSchema = new mongoose.Schema({
  test_id: { type: Number, required: true },
  student: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true }
});
testResultSchema.set('toJSON', { virtuals: true });
const TestResult = mongoose.model('TestResult', testResultSchema);

const participantSchema = new mongoose.Schema({
  class_id: { type: Number, required: true },
  student_name: { type: String, required: true }
});
participantSchema.index({ class_id: 1, student_name: 1 }, { unique: true });
const Participant = mongoose.model('Participant', participantSchema);

const attendanceSchema = new mongoose.Schema({
  student_name: { type: String, required: true, unique: true },
  count: { type: Number, default: 18 },
  total: { type: Number, default: 22 },
  today: { type: String, default: 'Pending' }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);


// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- Routes ---

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({ email, name, role, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      console.error('Register Error:', error);
      res.status(500).json({ error: 'Database error: ' + (error.message || error) });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(400).json({ error: 'User not found or role mismatch' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Logged in successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Database error: ' + (error.message || error) });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Classes
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    const classes = await Class.find({ status: 'live' });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/classes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can start classes' });
  
  const { id, course, faculty, time } = req.body;
  try {
    const newClass = new Class({ id, course, faculty, time });
    await newClass.save();
    res.status(201).json({ message: 'Class started' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/classes/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can end classes' });
  
  try {
    await Class.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Class ended' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Participants / Attendance
app.get('/api/classes/:id/participants', authenticateToken, async (req, res) => {
  try {
    const participants = await Participant.find({ class_id: req.params.id });
    res.json(participants.map(p => p.student_name));
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/classes/:id/join', authenticateToken, async (req, res) => {
  const { student_name } = req.body;
  const classId = req.params.id;

  try {
    try {
        const p = new Participant({ class_id: classId, student_name });
        await p.save();
    } catch(err) {
        if (err.code !== 11000) throw err;
    }

    if (req.user.role === 'Student') {
        let record = await Attendance.findOne({ student_name });
        if (!record) {
            record = new Attendance({ student_name, count: 17, total: 22, today: 'Pending' });
            await record.save();
        } else if (record.today !== 'Present' && record.today !== 'Absent') {
            record.today = 'Pending';
            await record.save();
        }
    }

    res.json({ message: 'Joined class successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/attendance', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Student') return res.status(403).json({ error: 'Not a student' });
    const { status } = req.body;
    
    try {
        let record = await Attendance.findOne({ student_name: req.user.name });
        
        if (status === 'Present') {
            if (!record) {
                record = new Attendance({ student_name: req.user.name, count: 18, total: 22, today: 'Present' });
                await record.save();
            } else if (record.today !== 'Present') {
                record.count += 1;
                record.today = 'Present';
                await record.save();
            }
        } else if (status === 'Absent') {
            if (!record) {
                record = new Attendance({ student_name: req.user.name, count: 17, total: 22, today: 'Absent' });
                await record.save();
            } else if (record.today !== 'Absent') {
                if (record.today === 'Present') {
                    record.count -= 1;
                }
                record.today = 'Absent';
                await record.save();
            }
        }
        res.json({ message: 'Attendance status recorded' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/attendance', authenticateToken, async (req, res) => {
   if(req.user.role !== 'Student') return res.status(400).json({error: 'Not a student'});
   try {
     const record = await Attendance.findOne({ student_name: req.user.name });
     
     if(!record) {
         res.json({ count: 18, total: 22, today: 'Pending' });
     } else {
         res.json(record);
     }
   } catch (err) {
     res.status(500).json({ error: 'Database error' });
   }
});

// Announcements
app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
      const anns = await Announcement.find().sort({ _id: -1 });
      res.json(anns);
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/announcements', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can post announcements' });
  
  const { text, date } = req.body;
  try {
      const ann = new Announcement({ text, date });
      await ann.save();
      res.status(201).json({ message: 'Announcement posted' });
  } catch(err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Timetable
app.get('/api/timetable', authenticateToken, async (req, res) => {
  try {
      const items = await Timetable.find();
      res.json(items);
  } catch(err) {
      res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/timetable', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
  
  const { course, faculty, time } = req.body;
  try {
      const tt = new Timetable({ course, faculty, time });
      await tt.save();
      res.status(201).json({ id: tt.id, course, faculty, time });
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/timetable/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
  
  const { course, faculty, time } = req.body;
  try {
      await Timetable.findByIdAndUpdate(req.params.id, { course, faculty, time });
      res.json({ message: 'Timetable updated' });
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/timetable/:id', authenticateToken, async (req, res) => {
   if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
   try {
       await Timetable.findByIdAndDelete(req.params.id);
       res.json({ message: 'Timetable deleted' });
   } catch(err) {
       res.status(500).json({ error: 'Database error' });
   }
});

// Feedback
app.get('/api/feedback', authenticateToken, async (req, res) => {
  try {
      const fbs = await Feedback.find().sort({ _id: -1 });
      res.json(fbs);
  } catch(err) {
      res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/feedback', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Student') return res.status(403).json({ error: 'Only students can submit feedback' });
  
  const { text, rating } = req.body;
  try {
      const fb = new Feedback({ text, rating });
      await fb.save();
      res.status(201).json({ message: 'Feedback submitted' });
  } catch(err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Tests
app.get('/api/tests', authenticateToken, async (req, res) => {
  try {
      const tests = await Test.find({ status: 'active' });
      res.json(tests);
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/tests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can create tests' });
  
  const { id, title, faculty, questions, answers } = req.body;
  try {
      const test = new Test({ id, title, faculty, questions, answers });
      await test.save();
      res.status(201).json({ message: 'Test created' });
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/test-results', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can view all results' });
    try {
        const results = await TestResult.find();
        res.json(results);
    } catch(err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/test-results', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Student') return res.status(403).json({ error: 'Only students can submit tests' });
    const { test_id, student, score, total } = req.body;
    try {
        const result = new TestResult({ test_id, student, score, total });
        await result.save();
        res.status(201).json({message: 'Test submitted'});
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
