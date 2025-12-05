// api/sendResult.js

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    let data = req.body || {};

    // If body comes as a string, try to parse
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse JSON body:', e);
      }
    }

    // Basic validation
    if (!data || !data.appName) {
      res.status(400).json({ ok: false, error: 'Invalid payload: appName is required' });
      return;
    }

    console.log('Received result:', JSON.stringify(data, null, 2));

    // 🔐 Read credentials from environment variables
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // <- put the NEW chat ID here in Vercel

    if (BOT_TOKEN && CHAT_ID) {
      const score = data.score || {};
      const student = data.student || {};

      const lines = [
        `📘 App: ${data.appName}`,
        `🧪 Mode: ${data.mode || 'Test'}`,
        `🧑‍🎓 Student: ${(student.name || '').trim()} ${(student.surname || '').trim()}`.trim(),
        `👥 Group: ${student.group || '—'}`,
        `📅 Date/Time: ${new Date(data.timestamp || Date.now()).toLocaleString()}`,
        `📊 Score: ${score.correct || 0}/${score.total || 0} (${score.percentage ?? 0}%)`,
        `${data.status === 'Completed' ? '✅ Status: Completed' : '⚠️ Status: ' + (data.status || 'Unknown')}`
      ];

      if (data.extraDetails) {
        lines.push('');
        lines.push(data.extraDetails);
      }

      const message = lines.join('\n');

      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message
          })
        });
      } catch (tgError) {
        console.error('Error sending message to Telegram:', tgError);
      }
    } else {
      console.warn(
        'Telegram not configured: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in env vars'
      );
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error in sendResult API:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};
