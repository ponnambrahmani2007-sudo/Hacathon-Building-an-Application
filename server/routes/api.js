import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import express from 'express'
import { query } from '../db/pool.js'
import { requireAuth, requireManager, signUser } from '../middleware/auth.js'
import { chatWithAssistant, generateTeamSummary, verifyWorkLog } from '../services/gemini.js'
import { sendOtpSms } from '../services/twilio.js'

export const api = express.Router()

const userFields = `
  id, username, name, email, phone, role, title, department,
  profile_photo_url AS "profilePhotoUrl",
  daily_target_hours AS "dailyTargetHours", is_active AS "isActive",
  terms_accepted_at AS "termsAcceptedAt",
  created_at AS "createdAt", updated_at AS "updatedAt"
`

const taskFields = `
  t.id, t.title, t.description, t.assigned_to AS "assignedTo", t.created_by AS "createdBy",
  t.status, t.priority, t.progress, t.deadline, t.completed_at AS "completedAt",
  t.created_at AS "createdAt", t.updated_at AS "updatedAt",
  u.name AS "assignedEmployeeName", u.department AS "assignedDepartment"
`

const logFields = `
  wl.id, wl.task_id AS "taskId", wl.employee_id AS "employeeId", wl.log_text AS "logText",
  wl.hours_worked AS "hoursWorked", wl.ai_score AS "aiScore", wl.ai_status AS "aiStatus",
  wl.ai_feedback AS "aiFeedback", wl.submitted_at AS "submittedAt",
  u.name AS "employeeName", t.title AS "taskTitle"
`

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const phoneRegex = /^\+[1-9]\d{7,14}$/
const maxFilesPerRequest = 5
const maxFileSize = 5 * 1024 * 1024

async function recordAudit({ action, user, taskId = null, metadata = {} }) {
  await query(
    'INSERT INTO audit_logs (action, user_id, user_name, task_id, metadata) VALUES ($1, $2, $3, $4, $5)',
    [action, user.id, user.name || user.username, taskId, metadata],
  )
}

function validateAccount({ username, email, phone, password, requireTerms = false, termsAccepted = false }) {
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username || '')) return 'Username must be 3-32 characters and use letters, numbers, dots, underscores, or hyphens.'
  if (email && !emailRegex.test(email)) return 'Enter a valid email address.'
  if (phone && !phoneRegex.test(phone)) return 'Phone must be in international format, for example +919876543210.'
  if (!passwordRegex.test(password || '')) return 'Password must be at least 8 characters and include one letter and one number.'
  if (requireTerms && !termsAccepted) return 'Terms and conditions must be accepted.'
  return ''
}

function normalizeAttachments(files) {
  if (!Array.isArray(files)) return []
  return files.slice(0, maxFilesPerRequest).map((file) => ({
    fileName: String(file.fileName || file.name || '').slice(0, 180),
    fileType: String(file.fileType || file.type || 'application/octet-stream').slice(0, 120),
    fileSize: Number(file.fileSize || file.size || 0),
    fileData: String(file.fileData || file.dataUrl || ''),
  })).filter((file) => file.fileName && file.fileData && file.fileSize >= 0 && file.fileSize <= maxFileSize)
}

async function saveTaskAttachments({ taskId, userId, files, source }) {
  const attachments = normalizeAttachments(files)
  for (const file of attachments) {
    await query(
      `INSERT INTO task_attachments (task_id, uploaded_by, file_name, file_type, file_size, file_data, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [taskId, userId, file.fileName, file.fileType, file.fileSize, file.fileData, source],
    )
  }
  return attachments.length
}

async function getTaskAttachments(taskId) {
  const result = await query(
    `SELECT id, task_id AS "taskId", file_name AS "fileName", file_type AS "fileType",
            file_size AS "fileSize", file_data AS "fileData", source, created_at AS "createdAt"
     FROM task_attachments WHERE task_id = $1 ORDER BY created_at DESC`,
    [taskId],
  )
  return result.rows
}

async function getCurrentUser(id) {
  const result = await query(`SELECT ${userFields} FROM users WHERE id = $1 AND is_active = true`, [id])
  return result.rows[0]
}

api.post('/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    const result = await query('SELECT * FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1)', [username || ''])
    const user = result.rows[0]
    if (!user || !user.is_active || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ message: 'Invalid username or password.' })
    }
    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id])
    const profile = await getCurrentUser(user.id)
    return res.json({ token: signUser(profile), user: profile })
  } catch (error) {
    return next(error)
  }
})

api.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id)
    return res.json({ user })
  } catch (error) {
    return next(error)
  }
})

api.get('/bootstrap', requireAuth, async (req, res, next) => {
  try {
    const [employees, tasks, workLogs, attachments, auditLogs] = await Promise.all([
      query(`SELECT ${userFields} FROM users WHERE role = 'employee' AND is_active = true ORDER BY name`),
      query(`SELECT ${taskFields} FROM tasks t JOIN users u ON u.id = t.assigned_to ORDER BY t.created_at DESC`),
      query(`SELECT ${logFields} FROM work_logs wl JOIN users u ON u.id = wl.employee_id JOIN tasks t ON t.id = wl.task_id ORDER BY wl.submitted_at DESC`),
      query(
        `SELECT id, task_id AS "taskId", file_name AS "fileName", file_type AS "fileType",
                file_size AS "fileSize", file_data AS "fileData", source, created_at AS "createdAt"
         FROM task_attachments ORDER BY created_at DESC`,
      ),
      query('SELECT id, action, user_name AS "userName", task_id AS "taskId", metadata, created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC LIMIT 200'),
    ])
    return res.json({ employees: employees.rows, tasks: tasks.rows, workLogs: workLogs.rows, attachments: attachments.rows, auditLogs: auditLogs.rows })
  } catch (error) {
    return next(error)
  }
})

api.post('/employees', requireAuth, requireManager, async (req, res, next) => {
  try {
    const { username, name, email, phone, password, title, department, dailyTargetHours, profilePhotoUrl, termsAccepted } = req.body
    if (!username || !name || !password) return res.status(400).json({ message: 'Username, name, and password are required.' })
    const validationError = validateAccount({ username, email, phone, password, requireTerms: true, termsAccepted })
    if (validationError) return res.status(400).json({ message: validationError })
    const hash = await bcrypt.hash(password, 12)
    const result = await query(
      `INSERT INTO users (username, name, email, phone, password_hash, role, title, department, profile_photo_url, daily_target_hours, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, 'employee', $6, $7, $8, $9, now())
       RETURNING ${userFields}`,
      [username, name, email || null, phone || null, hash, title || 'Employee', department || 'Operations', profilePhotoUrl || null, Number(dailyTargetHours || 8)],
    )
    const manager = await getCurrentUser(req.user.id)
    await recordAudit({ action: 'Employee Created', user: manager, metadata: { employeeId: result.rows[0].id, username } })
    return res.status(201).json({ employee: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Username or email already exists.' })
    return next(error)
  }
})

api.post('/tasks', requireAuth, requireManager, async (req, res, next) => {
  try {
    const { title, description, assignedTo, deadline, priority, attachments } = req.body
    if (!title || !description || !assignedTo || !deadline) return res.status(400).json({ message: 'Task title, description, assignee, and deadline are required.' })
    const result = await query(
      `INSERT INTO tasks (title, description, assigned_to, created_by, deadline, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [title, description, assignedTo, req.user.id, deadline, priority || 'Standard'],
    )
    const manager = await getCurrentUser(req.user.id)
    const attachmentCount = await saveTaskAttachments({ taskId: result.rows[0].id, userId: req.user.id, files: attachments, source: 'assignment' })
    await recordAudit({ action: 'Task Created', user: manager, taskId: result.rows[0].id, metadata: { attachmentCount } })
    const task = await query(`SELECT ${taskFields} FROM tasks t JOIN users u ON u.id = t.assigned_to WHERE t.id = $1`, [result.rows[0].id])
    return res.status(201).json({ task: task.rows[0], attachments: await getTaskAttachments(result.rows[0].id) })
  } catch (error) {
    return next(error)
  }
})

api.patch('/tasks/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) return res.status(400).json({ message: 'Invalid status.' })
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id])
    const task = taskResult.rows[0]
    if (!task) return res.status(404).json({ message: 'Task not found.' })
    if (req.user.role !== 'manager' && task.assigned_to !== req.user.id) return res.status(403).json({ message: 'You can update only your own task.' })
    await query('UPDATE tasks SET status = $1, progress = CASE WHEN $1 = $2 THEN 100 WHEN $1 = $3 THEN GREATEST(progress, 45) ELSE progress END WHERE id = $4', [status, 'Completed', 'In Progress', req.params.id])
    const user = await getCurrentUser(req.user.id)
    await recordAudit({ action: 'Status Changed', user, taskId: req.params.id, metadata: { status } })
    const updated = await query(`SELECT ${taskFields} FROM tasks t JOIN users u ON u.id = t.assigned_to WHERE t.id = $1`, [req.params.id])
    return res.json({ task: updated.rows[0] })
  } catch (error) {
    return next(error)
  }
})

api.post('/work-logs', requireAuth, async (req, res, next) => {
  try {
    const { taskId, logText, hoursWorked, attachments } = req.body
    const taskResult = await query(`SELECT ${taskFields} FROM tasks t JOIN users u ON u.id = t.assigned_to WHERE t.id = $1`, [taskId])
    const task = taskResult.rows[0]
    if (!task) return res.status(404).json({ message: 'Task not found.' })
    if (req.user.role !== 'manager' && task.assignedTo !== req.user.id) return res.status(403).json({ message: 'You can log only your assigned task.' })
    const ai = await verifyWorkLog(task, logText || '')
    const result = await query(
      `INSERT INTO work_logs (task_id, employee_id, log_text, hours_worked, ai_score, ai_status, ai_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [taskId, req.user.id, logText, Number(hoursWorked || 1), ai.score, ai.status, ai.feedback],
    )
    const user = await getCurrentUser(req.user.id)
    const attachmentCount = await saveTaskAttachments({ taskId, userId: req.user.id, files: attachments, source: 'work_log' })
    await recordAudit({ action: 'Work Log Submitted', user, taskId, metadata: { attachmentCount } })
    const log = await query(`SELECT ${logFields} FROM work_logs wl JOIN users u ON u.id = wl.employee_id JOIN tasks t ON t.id = wl.task_id WHERE wl.id = $1`, [result.rows[0].id])
    return res.status(201).json({ workLog: log.rows[0], attachments: await getTaskAttachments(taskId) })
  } catch (error) {
    return next(error)
  }
})

api.post('/ai/summary', requireAuth, requireManager, async (req, res, next) => {
  try {
    const [employees, tasks, workLogs] = await Promise.all([
      query(`SELECT ${userFields} FROM users WHERE role = 'employee' AND is_active = true ORDER BY name`),
      query(`SELECT ${taskFields} FROM tasks t JOIN users u ON u.id = t.assigned_to ORDER BY t.created_at DESC`),
      query(`SELECT ${logFields} FROM work_logs wl JOIN users u ON u.id = wl.employee_id JOIN tasks t ON t.id = wl.task_id ORDER BY wl.submitted_at DESC`),
    ])
    return res.json({ summary: await generateTeamSummary(tasks.rows, workLogs.rows, employees.rows) })
  } catch (error) {
    return next(error)
  }
})

api.post('/ai/chat', requireAuth, async (req, res, next) => {
  try {
    const context = req.body.context || {}
    const answer = await chatWithAssistant(String(req.body.message || ''), context)
    return res.json({ answer })
  } catch (error) {
    return next(error)
  }
})

api.post('/password/send-otp', async (req, res, next) => {
  try {
    const { username } = req.body
    const result = await query('SELECT id, phone FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1)', [username || ''])
    const user = result.rows[0]
    if (!user?.phone) return res.status(400).json({ message: 'No phone number is registered for this account.' })
    const otp = String(crypto.randomInt(100000, 999999))
    const hash = await bcrypt.hash(otp, 10)
    await query('INSERT INTO password_otps (user_id, otp_hash, expires_at) VALUES ($1, $2, now() + interval \'10 minutes\')', [user.id, hash])
    await sendOtpSms(user.phone, otp)
    return res.json({ message: 'OTP sent.' })
  } catch (error) {
    return next(error)
  }
})

api.post('/password/reset', async (req, res, next) => {
  try {
    const { username, otp, newPassword } = req.body
    if (!passwordRegex.test(newPassword || '')) return res.status(400).json({ message: 'Password must be at least 8 characters and include one letter and one number.' })
    const userResult = await query('SELECT id FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1)', [username || ''])
    const user = userResult.rows[0]
    if (!user) return res.status(400).json({ message: 'Invalid OTP.' })
    const otpResult = await query('SELECT * FROM password_otps WHERE user_id = $1 AND consumed_at IS NULL AND expires_at > now() ORDER BY created_at DESC LIMIT 1', [user.id])
    const otpRow = otpResult.rows[0]
    if (!otpRow || !(await bcrypt.compare(otp || '', otpRow.otp_hash))) return res.status(400).json({ message: 'Invalid OTP.' })
    await query('UPDATE password_otps SET consumed_at = now() WHERE id = $1', [otpRow.id])
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash(newPassword, 12), user.id])
    return res.json({ message: 'Password reset successful.' })
  } catch (error) {
    return next(error)
  }
})
