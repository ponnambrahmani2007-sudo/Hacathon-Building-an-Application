import twilio from 'twilio'

export async function sendOtpSms(to, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!sid || !token || !from) {
    throw new Error('Twilio is not configured on the server.')
  }

  const client = twilio(sid, token)
  return client.messages.create({
    from,
    to,
    body: `Your WorkFlow password reset OTP is ${otp}. It expires in 10 minutes.`,
  })
}
