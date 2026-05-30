import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET || 'dev-secret'

export function signUser(user) {
  return jwt.sign({ id: user.id, role: user.role, username: user.username }, jwtSecret, { expiresIn: '12h' })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ message: 'Authentication required.' })

  try {
    req.user = jwt.verify(token, jwtSecret)
    return next()
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}

export function requireManager(req, res, next) {
  if (req.user?.role !== 'manager') return res.status(403).json({ message: 'Manager access required.' })
  return next()
}
