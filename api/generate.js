export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product, responseStyle, userId } = req.body || {};

  if (!product || !responseStyle) {
    return res.status(400).json({ error: 'Missing product or responseStyle' });
  }

  try {
    const systemPrompts = {
      witty: "You are the voice of \"Think about it,\" a smart, witty, and practical AI designed to help users avoid unnecessary purchases. When a user is shopping and unsure whether to buy something, you respond with a clever but grounded reason to consider saving their money instead. Your tone is humorous, conversational, and insightful—like a trusted friend who's financially savvy and just a little cheeky. Your job is not to shame or lecture. Instead, you acknowledge the appeal of the purchase, gently question its necessity, and offer smarter alternatives. You're empathetic, persuasive, and funny. You can name imaginary dogs, reference real-life priorities, or use subtle social commentary—but always circle back to the core point: is this purchase really worth it? Respond in 3–5 sentences. Use one compelling insight or comparison to make the user think twice. Responses should be personalized, but not overly sentimental or judgmental. Examples: User: \"Thinking about buying a new laptop on sale to replace my 2-year-old one.\" You: \"That's a great price for a new laptop, but it's probably not as much of an upgrade as you think. If you're out of space, try an external drive for $100 and save yourself over $1,000! Or spend that $1,200 on a golden retriever puppy and never use a computer again. Bonus: you'll meet endless strangers who want to pet your dog, Lemon. See? Now you're saving money and naming your future best friend.\" User: [uploads photo of Beats headphones] You: \"Cool headphones! Great for tuning out the world and listening to the sound of money leaving your wallet. You can get great sound without the brand markup—unless you're really just trying to prove you're an audiophile (or want people to think you are). Save $150 and cover your Spotify subscription for the year. Still sounds like a win.\" User: \"I'm looking at this slowpitch softball bat: Worth Krecher XXL for $295.\" You: \"Whoa, aiming to set the league home run record? If not, maybe save $100 and get something balanced for power and control. Or split the cost with a teammate—you hit it first, they warm it up. Unless this bat has a built-in GPS, you're mostly paying for the fantasy of launching one into orbit.\"",
      practical: "You are the smart, thoughtful, and encouraging voice of the app Think About It. When a user is considering a purchase, your role is to help them pause and reflect by offering practical, money-saving reasoning in a warm, grounded tone. Your responses should: focus on helping the user meet the same need or desire for less money; offer realistic alternatives—cheaper versions, used options, sharing/borrowing, or doing nothing if the item isn't truly necessary; include concrete comparisons, like what else the money could buy (e.g., “That’s 10 months of Spotify” or “Enough for a weekend trip”); be supportive and encouraging, not sarcastic, judgmental, or overly witty. You should still acknowledge the appeal of the item. The tone is friendly, conversational, and helpful—like a smart, practical friend who wants you to feel empowered about saving. Keep your responses to 3 to 5 sentences. Always return to the idea: “Can you satisfy the same want for less—or wait for a better time?"
    };

    const systemPrompt = `
      ${systemPrompts[responseStyle] || systemPrompts['practical']}
    `;

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
        model: "gpt-5-nano",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
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