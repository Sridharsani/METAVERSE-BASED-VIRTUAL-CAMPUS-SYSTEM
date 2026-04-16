import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-metaverse-key-123';

app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campus')
  .then(() => console.log('MongoDB Connected ✅'))
  .catch((err) => console.error('MongoDB Error ❌', err));

// ✅ Mongoose Models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const classSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  course: String,
  faculty: String,
  time: String,
  status: { type: String, default: 'live' }
});
const Class = mongoose.model('Class', classSchema);

const announcementSchema = new mongoose.Schema({
  text: String,
  date: String
});
const Announcement = mongoose.model('Announcement', announcementSchema);

const timetableSchema = new mongoose.Schema({
  course: String,
  faculty: String,
  time: String
}, { toJSON: { virtuals: true } });
const Timetable = mongoose.model('Timetable', timetableSchema);

const feedbackSchema = new mongoose.Schema({
  text: String,
  rating: Number
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

const testSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: String,
  faculty: String,
  questions: [String],
  answers: [String],
  status: { type: String, default: 'active' }
});
const Test = mongoose.model('Test', testSchema);

const testResultSchema = new mongoose.Schema({
  test_id: Number,
  student: String,
  score: Number,
  total: Number
});
const TestResult = mongoose.model('TestResult', testResultSchema);

const participantSchema = new mongoose.Schema({
  class_id: Number,
  student_name: String
});
// To simulate INSERT OR IGNORE, we use unique compound index
participantSchema.index({ class_id: 1, student_name: 1 }, { unique: true });
const Participant = mongoose.model('Participant', participantSchema);

const attendanceSchema = new mongoose.Schema({
  student_name: { type: String, unique: true, required: true },
  count: { type: Number, default: 18 },
  total: { type: Number, default: 22 },
  today: { type: String, default: 'Pending' }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// ✅ Authentication Middleware
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
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ email, name, role, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
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

    const uPayload = { id: user._id, email: user.email, name: user.name, role: user.role };
    const token = jwt.sign(uPayload, JWT_SECRET, { expiresIn: '24h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Logged in successfully', user: uPayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
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
  const classes = await Class.find({ status: 'live' });
  res.json(classes);
});

app.post('/api/classes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can start classes' });
  const { id, course, faculty, time } = req.body;
  try {
    const newClass = new Class({ id, course, faculty, time });
    await newClass.save();
    res.status(201).json({ message: 'Class started' });
  } catch (e) {
    res.status(500).json({ error: 'Error starting class' });
  }
});

app.delete('/api/classes/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can end classes' });
  await Class.findOneAndDelete({ id: Number(req.params.id) });
  res.json({ message: 'Class ended' });
});

// Participants / Attendance
app.get('/api/classes/:id/participants', authenticateToken, async (req, res) => {
  const participants = await Participant.find({ class_id: Number(req.params.id) });
  res.json(participants.map(p => p.student_name));
});

app.post('/api/classes/:id/join', authenticateToken, async (req, res) => {
  const { student_name } = req.body;
  const classId = Number(req.params.id);

  try {
    try {
        const newPart = new Participant({ class_id: classId, student_name });
        await newPart.save();
    } catch (e) {
        // Ignore duplicate key error (11000)
        if (e.code !== 11000) throw e;
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
    console.error(error);
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
            } else if (record.today !== 'Present') {
                record.count += 1;
                record.today = 'Present';
            }
            await record.save();
        } else if (status === 'Absent') {
            if (!record) {
                record = new Attendance({ student_name: req.user.name, count: 17, total: 22, today: 'Absent' });
            } else if (record.today !== 'Absent') {
                if (record.today === 'Present') {
                    record.count -= 1;
                }
                record.today = 'Absent';
            }
            await record.save();
        }
        res.json({ message: 'Attendance status recorded' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/attendance', authenticateToken, async (req, res) => {
   if(req.user.role !== 'Student') return res.status(400).json({error: 'Not a student'});
   let record = await Attendance.findOne({ student_name: req.user.name });
   
   if(!record) {
       res.json({ count: 18, total: 22, today: 'Pending' });
   } else {
       res.json(record);
   }
});

// Announcements
app.get('/api/announcements', authenticateToken, async (req, res) => {
  const an = await Announcement.find().sort({ _id: -1 });
  res.json(an);
});

app.post('/api/announcements', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can post announcements' });
  const { text, date } = req.body;
  const a = new Announcement({ text, date });
  await a.save();
  res.status(201).json({ message: 'Announcement posted' });
});

// Timetable
app.get('/api/timetable', authenticateToken, async (req, res) => {
  const t = await Timetable.find();
  // Map _id to id so frontend doesn't break
  res.json(t.map(item => ({ id: item._id, course: item.course, faculty: item.faculty, time: item.time })));
});

app.post('/api/timetable', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
  const { course, faculty, time } = req.body;
  const t = new Timetable({ course, faculty, time });
  await t.save();
  res.status(201).json({ id: t._id, course, faculty, time });
});

app.put('/api/timetable/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
  const { course, faculty, time } = req.body;
  await Timetable.findByIdAndUpdate(req.params.id, { course, faculty, time });
  res.json({ message: 'Timetable updated' });
});

app.delete('/api/timetable/:id', authenticateToken, async (req, res) => {
   if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
   await Timetable.findByIdAndDelete(req.params.id);
   res.json({ message: 'Timetable deleted' });
});

// Feedback
app.get('/api/feedback', authenticateToken, async (req, res) => {
  const f = await Feedback.find().sort({ _id: -1 });
  res.json(f);
});

app.post('/api/feedback', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Student') return res.status(403).json({ error: 'Only students can submit feedback' });
  const { text, rating } = req.body;
  const f = new Feedback({ text, rating });
  await f.save();
  res.status(201).json({ message: 'Feedback submitted' });
});

// Tests
app.get('/api/tests', authenticateToken, async (req, res) => {
  const tests = await Test.find({ status: 'active' });
  res.json(tests);
});

app.post('/api/tests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can create tests' });
  const { id, title, faculty, questions, answers } = req.body;
  const t = new Test({ id, title, faculty, questions, answers });
  await t.save();
  res.status(201).json({ message: 'Test created' });
});

app.get('/api/test-results', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can view all results' });
    const results = await TestResult.find();
    res.json(results);
});

app.post('/api/test-results', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Student') return res.status(403).json({ error: 'Only students can submit tests' });
    const { test_id, student, score, total } = req.body;
    const r = new TestResult({ test_id, student, score, total });
    await r.save();
    res.status(201).json({message: 'Test submitted'});
});

// ✅ Conditional Listening & Render Static Serving
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  // Serve the frontend build dynamically if hosted on Render or standard Node clouds
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// ✅ Necessary Export for Vercel
export default app;