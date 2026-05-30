import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

function fallbackLogReview(task, logText) {
  const text = logText.toLowerCase()
  const keywords = `${task.title} ${task.description}`.toLowerCase().split(/\W+/).filter((word) => word.length > 4)
  const matches = keywords.filter((word) => text.includes(word)).length
  const score = Math.min(100, Math.floor(logText.length / 4) + matches * 12)
  if (score >= 75) return { score, status: 'Good', feedback: 'Detailed and aligned with the task.' }
  if (score >= 45) return { score, status: 'Suspicious', feedback: 'Partially aligned, but needs clearer evidence of progress.' }
  return { score, status: 'Poor', feedback: 'Too vague or weakly connected to the task.' }
}

function getModel() {
  if (!apiKey) return null
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName })
}

function parseJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Gemini did not return JSON.')
  return JSON.parse(match[0])
}

export async function verifyWorkLog(task, logText) {
  const model = getModel()
  if (!model) return fallbackLogReview(task, logText)

  try {
    const result = await model.generateContent(`
You are an employee accountability auditor for a task management system.

Task:
${JSON.stringify(task, null, 2)}

Work log:
${logText}

Return only valid JSON:
{"score":0-100,"status":"Good|Suspicious|Poor","feedback":"short direct explanation"}
`)
    const parsed = parseJson(result.response.text())
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      status: ['Good', 'Suspicious', 'Poor'].includes(parsed.status) ? parsed.status : 'Suspicious',
      feedback: String(parsed.feedback || 'No AI feedback returned.'),
    }
  } catch (error) {
    console.error(error)
    return fallbackLogReview(task, logText)
  }
}

export async function generateTeamSummary(tasks, workLogs, employees) {
  const model = getModel()
  if (!model) return 'AI summary is unavailable because Gemini is not configured on the server.'

  const result = await model.generateContent(`
Analyze this team's task delivery, working hours, and AI verification risk.

Employees:
${JSON.stringify(employees, null, 2)}

Tasks:
${JSON.stringify(tasks, null, 2)}

Work logs:
${JSON.stringify(workLogs, null, 2)}

Return concise Markdown with: delivery health, employees behind schedule, overdue tasks, top performers, hour utilization, and risks.
`)
  return result.response.text()
}

export async function chatWithAssistant(message, context) {
  const model = getModel()
  if (!model) return 'Gemini is not configured on the server.'

  const result = await model.generateContent(`
You are the AI assistant inside WorkFlow, an AI-based task management system.
Answer clearly and helpfully. Use the provided workspace context when relevant.

Workspace context:
${JSON.stringify(context, null, 2)}

User question:
${message}
`)
  return result.response.text()
}
