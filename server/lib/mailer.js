import nodemailer from 'nodemailer'

const isProduction = process.env.NODE_ENV === 'production'
const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const mailFrom = process.env.MAIL_FROM || smtpUser
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
  )
}

export function isMailerConfigured() {
  return Boolean(transporter)
}

export async function sendVerificationEmail({ to, fullName, verificationUrl }) {
  if (!isProduction) {
    console.log(`[auth] verification link for ${to}: ${verificationUrl}`)
  }

  if (!transporter) {
    if (isProduction) {
      console.error('[mail] SMTP is not configured — verification email was not sent.')
    }
    return false
  }

  const safeName = escapeHtml(fullName)
  const safeUrl = escapeHtml(verificationUrl)
  const subject = 'ACCESS CENTER — Vérifiez votre e-mail / أكّد بريدك الإلكتروني'

  const text = [
    `Bonjour ${fullName},`,
    '',
    'Merci de votre inscription à ACCESS CENTER. Confirmez votre adresse e-mail en ouvrant ce lien (valable 24 heures) :',
    verificationUrl,
    '',
    `مرحباً ${fullName}،`,
    'شكراً لتسجيلك في ACCESS CENTER. أكّد بريدك الإلكتروني عبر فتح هذا الرابط (صالح لمدة 24 ساعة):',
    verificationUrl,
    '',
    "Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.",
    'إذا لم تكن صاحب هذا التسجيل، تجاهل هذه الرسالة.',
  ].join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto">
      <h2 style="color:#1e3a5f">ACCESS CENTER</h2>
      <p>Bonjour ${safeName},</p>
      <p>Merci de votre inscription. Confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous (lien valable 24 heures) :</p>
      <p><a href="${safeUrl}" style="display:inline-block;background:#1e3a5f;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none">Vérifier mon e-mail</a></p>
      <p style="font-size:13px;color:#475569">Ou copiez ce lien :<br>${safeUrl}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <div dir="rtl" style="text-align:right">
        <p>مرحباً ${safeName}،</p>
        <p>شكراً لتسجيلك في ACCESS CENTER. أكّد بريدك الإلكتروني بالضغط على الرابط أعلاه (صالح لمدة 24 ساعة).</p>
      </div>
      <p style="font-size:12px;color:#94a3b8">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.<br>إذا لم تكن صاحب هذا التسجيل، تجاهل هذه الرسالة.</p>
    </div>
  `

  try {
    await transporter.sendMail({ from: mailFrom, to, subject, text, html })
    return true
  } catch (error) {
    console.error('[mail] verification email failed:', error.message)
    return false
  }
}

export async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  if (!isProduction) {
    console.log(`[auth] password reset link for ${to}: ${resetUrl}`)
  }

  if (!transporter) {
    if (isProduction) {
      console.error('[mail] SMTP is not configured — password reset email was not sent.')
    }
    return false
  }

  const safeName = escapeHtml(fullName)
  const safeUrl = escapeHtml(resetUrl)
  const subject = 'ACCESS CENTER — Réinitialisez votre mot de passe / إعادة تعيين كلمة المرور'

  const text = [
    `Bonjour ${fullName},`,
    '',
    'Vous avez demandé à réinitialiser votre mot de passe ACCESS CENTER. Ouvrez ce lien (valable 1 heure) pour en définir un nouveau :',
    resetUrl,
    '',
    `مرحباً ${fullName}،`,
    'طلبت إعادة تعيين كلمة المرور الخاصة بحسابك في ACCESS CENTER. افتح هذا الرابط (صالح لمدة ساعة واحدة) لتعيين كلمة مرور جديدة:',
    resetUrl,
    '',
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe restera inchangé.",
    'إذا لم تكن صاحب هذا الطلب، تجاهل هذه الرسالة: ستبقى كلمة المرور دون تغيير.',
  ].join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto">
      <h2 style="color:#1e3a5f">ACCESS CENTER</h2>
      <p>Bonjour ${safeName},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau (lien valable 1 heure) :</p>
      <p><a href="${safeUrl}" style="display:inline-block;background:#1e3a5f;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none">Définir un nouveau mot de passe</a></p>
      <p style="font-size:13px;color:#475569">Ou copiez ce lien :<br>${safeUrl}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <div dir="rtl" style="text-align:right">
        <p>مرحباً ${safeName}،</p>
        <p>طلبت إعادة تعيين كلمة المرور. اضغط على الرابط أعلاه لتعيين كلمة مرور جديدة (صالح لمدة ساعة واحدة).</p>
      </div>
      <p style="font-size:12px;color:#94a3b8">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe restera inchangé.<br>إذا لم تكن صاحب هذا الطلب، تجاهل هذه الرسالة: ستبقى كلمة المرور دون تغيير.</p>
    </div>
  `

  try {
    await transporter.sendMail({ from: mailFrom, to, subject, text, html })
    return true
  } catch (error) {
    console.error('[mail] password reset email failed:', error.message)
    return false
  }
}
