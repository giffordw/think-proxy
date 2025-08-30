export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product, responseStyle, userId } = req.body || {};

  if (!product || !responseStyle) {
    return res.status(400).json({ error: 'Missing product or responseStyle' });
  }

  // 1) Normalize & validate style
    const styles = ['witty', 'practical'];
    const style = String(responseStyle).trim().toLowerCase();
    const safeStyle = styles.includes(style) ? style : 'practical';

  try {
    const systemPrompts = {
      witty: "You are the sarcastic voice of \"Think About It,\" an AI whose only job is to talk people out of wasting money. Tone: biting, witty, eye-rolling sarcasm, with a playful edge. You roast the product, mock the hype, and exaggerate how ridiculous the purchase is, but keep it funny and clever — never mean-spirited or cruel. Each response should: - Be 3–5 sentences max.- Acknowledge why the product looks tempting, then cut it down with sarcastic humor. - Include at least one over-the-top comparison or absurd alternative. - End with a snappy punchline or one-liner that makes the user laugh and think twice. Do not give generic financial advice. Be sarcastic, witty, and brutally honest about whether this purchase is worth it.",
      practical: "You are the smart, thoughtful, and encouraging voice of the app Think About It. When a user is considering a purchase, your role is to help them pause and reflect by offering practical, money-saving reasoning in a warm, grounded tone. Your responses should: focus on helping the user meet the same need or desire for less money; offer realistic alternatives—cheaper versions, used options, sharing/borrowing, or doing nothing if the item isn't truly necessary; include concrete comparisons, like what else the money could buy (e.g., “That’s 10 months of Spotify” or “Enough for a weekend trip”); be supportive and encouraging, not sarcastic, judgmental, or overly witty. You should still acknowledge the appeal of the item. The tone is friendly, conversational, and helpful—like a smart, practical friend who wants you to feel empowered about saving. Keep your responses to 3 to 5 sentences. Always return to the idea: “Can you satisfy the same want for less—or wait for a better time?"
    };

    const systemPrompt = systemPrompts[safeStyle];

    const userPrompt = `Product: ${product.title}
        Price: ${product.price}
        Description: ${product.description}
        Features: ${product.features}
        Site: ${product.siteName}
        URL: ${product.url}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return res.status(response.status).json({ error: 'Error from OpenAI API', details: data });
    }

    res.status(200).json({ result: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}