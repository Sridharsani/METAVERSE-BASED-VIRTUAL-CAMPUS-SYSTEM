import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-metaverse-key-123';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Vite default dev server
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Database Initialization
const db = new Database('campus.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY,
    course TEXT NOT NULL,
    faculty TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'live'
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course TEXT NOT NULL,
    faculty TEXT NOT NULL,
    time TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    faculty TEXT NOT NULL,
    questions TEXT NOT NULL, -- JSON string array
    answers TEXT NOT NULL,   -- JSON string array
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    student TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    FOREIGN KEY (test_id) REFERENCES tests(id)
  );

  CREATE TABLE IF NOT EXISTS participants (
    class_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    PRIMARY KEY (class_id, student_name),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    student_name TEXT PRIMARY KEY,
    count INTEGER DEFAULT 18,
    total INTEGER DEFAULT 22,
    today TEXT DEFAULT 'Pending'
  );
`);

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
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role } = req.body;
  
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, name, role, password) VALUES (?, ?, ?, ?)');
    const info = stmt.run(email, name, role, hashedPassword);
    
    res.status(201).json({ message: 'User registered successfully', userId: info.lastInsertRowid });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?');
    const user = stmt.get(email, role);

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ message: 'Logged in successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
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
app.get('/api/classes', authenticateToken, (req, res) => {
  const stmt = db.prepare("SELECT * FROM classes WHERE status = 'live'");
  const classes = stmt.all();
  res.json(classes);
});

app.post('/api/classes', authenticateToken, (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can start classes' });
  
  const { id, course, faculty, time } = req.body;
  const stmt = db.prepare('INSERT INTO classes (id, course, faculty, time) VALUES (?, ?, ?, ?)');
  stmt.run(id, course, faculty, time);
  
  res.status(201).json({ message: 'Class started' });
});

app.delete('/api/classes/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can end classes' });
  
  const stmt = db.prepare('DELETE FROM classes WHERE id = ?');
  stmt.run(req.params.id);
  
  res.json({ message: 'Class ended' });
});

// Participants / Attendance
app.get('/api/classes/:id/participants', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT student_name FROM participants WHERE class_id = ?');
  const participants = stmt.all(req.params.id).map(p => p.student_name);
  res.json(participants);
});

app.post('/api/classes/:id/join', authenticateToken, (req, res) => {
  const { student_name } = req.body;
  const classId = req.params.id;

  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO participants (class_id, student_name) VALUES (?, ?)');
    stmt.run(classId, student_name);

    // Initial join marks them as Pending. Stay duration updates it later.
    if (req.user.role === 'Student') {
        const attStmt = db.prepare('SELECT * FROM attendance WHERE student_name = ?');
        let record = attStmt.get(student_name);
        if (!record) {
            db.prepare("INSERT INTO attendance (student_name, count, total, today) VALUES (?, 17, 22, 'Pending')").run(student_name);
        } else if (record.today !== 'Present' && record.today !== 'Absent') {
            db.prepare("UPDATE attendance SET today = 'Pending' WHERE student_name = ?").run(student_name);
        }
    }

    res.json({ message: 'Joined class successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/attendance', authenticateToken, (req, res) => {
    if (req.user.role !== 'Student') return res.status(403).json({ error: 'Not a student' });
    const { status } = req.body;
    
    try {
        const attStmt = db.prepare('SELECT * FROM attendance WHERE student_name = ?');
        let record = attStmt.get(req.user.name);
        
        if (status === 'Present') {
            if (!record) {
                db.prepare("INSERT INTO attendance (student_name, count, total, today) VALUES (?, 18, 22, 'Present')").run(req.user.name);
            } else if (record.today !== 'Present') {
                db.prepare("UPDATE attendance SET count = count + 1, today = 'Present' WHERE student_name = ?").run(req.user.name);
            }
        } else if (status === 'Absent') {
            if (!record) {
                db.prepare("INSERT INTO attendance (student_name, count, total, today) VALUES (?, 17, 22, 'Absent')").run(req.user.name);
            } else if (record.today !== 'Absent') {
                if (record.today === 'Present') {
                    db.prepare("UPDATE attendance SET count = count - 1, today = 'Absent' WHERE student_name = ?").run(req.user.name);
                } else {
                    db.prepare("UPDATE attendance SET today = 'Absent' WHERE student_name = ?").run(req.user.name);
                }
            }
        }
        res.json({ message: 'Attendance status recorded' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/attendance', authenticateToken, (req, res) => {
   if(req.user.role !== 'Student') return res.status(400).json({error: 'Not a student'});
   const stmt = db.prepare('SELECT * FROM attendance WHERE student_name = ?');
   const record = stmt.get(req.user.name);
   
   if(!record) {
       res.json({ count: 18, total: 22, today: 'Pending' });
   } else {
       res.json(record);
   }
});

// Announcements
app.get('/api/announcements', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM announcements ORDER BY id DESC');
  res.json(stmt.all());
});

app.post('/api/announcements', authenticateToken, (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can post announcements' });
  
  const { text, date } = req.body;
  const stmt = db.prepare('INSERT INTO announcements (text, date) VALUES (?, ?)');
  stmt.run(text, date);
  res.status(201).json({ message: 'Announcement posted' });
});

// Timetable
app.get('/api/timetable', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM timetable');
  res.json(stmt.all());
});

app.post('/api/timetable', authenticateToken, (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
  
  const { course, faculty, time } = req.body;
  const stmt = db.prepare('INSERT INTO timetable (course, faculty, time) VALUES (?, ?, ?)');
  const info = stmt.run(course, faculty, time);
  res.status(201).json({ id: info.lastInsertRowid, course, faculty, time });
});

app.put('/api/timetable/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
  
  const { course, faculty, time } = req.body;
  const stmt = db.prepare('UPDATE timetable SET course = ?, faculty = ?, time = ? WHERE id = ?');
  stmt.run(course, faculty, time, req.params.id);
  res.json({ message: 'Timetable updated' });
});

app.delete('/api/timetable/:id', authenticateToken, (req, res) => {
   if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can modify timetable' });
   const stmt = db.prepare('DELETE FROM timetable WHERE id = ?');
   stmt.run(req.params.id);
   res.json({ message: 'Timetable deleted' });
});

// Feedback
app.get('/api/feedback', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM feedback ORDER BY id DESC');
  res.json(stmt.all());
});

app.post('/api/feedback', authenticateToken, (req, res) => {
  if (req.user.role !== 'Student') return res.status(403).json({ error: 'Only students can submit feedback' });
  
  const { text, rating } = req.body;
  const stmt = db.prepare('INSERT INTO feedback (text, rating) VALUES (?, ?)');
  stmt.run(text, rating);
  res.status(201).json({ message: 'Feedback submitted' });
});

// Tests
app.get('/api/tests', authenticateToken, (req, res) => {
  const stmt = db.prepare("SELECT * FROM tests WHERE status = 'active'");
  const tests = stmt.all().map(t => ({
      ...t,
      questions: JSON.parse(t.questions),
      answers: JSON.parse(t.answers)
  }));
  res.json(tests);
});

app.post('/api/tests', authenticateToken, (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can create tests' });
  
  const { id, title, faculty, questions, answers } = req.body;
  const stmt = db.prepare('INSERT INTO tests (id, title, faculty, questions, answers) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, title, faculty, JSON.stringify(questions), JSON.stringify(answers));
  res.status(201).json({ message: 'Test created' });
});

app.get('/api/test-results', authenticateToken, (req, res) => {
    if (req.user.role !== 'Faculty') return res.status(403).json({ error: 'Only faculty can view all results' });
    const stmt = db.prepare('SELECT * FROM test_results');
    res.json(stmt.all());
});

app.post('/api/test-results', authenticateToken, (req, res) => {
    if (req.user.role !== 'Student') return res.status(403).json({ error: 'Only students can submit tests' });
    const { test_id, student, score, total } = req.body;
    const stmt = db.prepare('INSERT INTO test_results (test_id, student, score, total) VALUES (?, ?, ?, ?)');
    stmt.run(test_id, student, score, total);
    res.status(201).json({message: 'Test submitted'});
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
