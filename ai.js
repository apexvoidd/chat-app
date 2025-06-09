import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const ai = new GoogleGenerativeAI("AIzaSyD40nGZ6-sqcBPOpGO9qomBt3W38b6m2IE");

// Add a memory map for each AI chat session
const botMemory = new Map();

function initializeMemory(socketId) {
  let memory = botMemory.get(socketId);
  if (!memory) {
    memory = [];
    botMemory.set(socketId, memory);
  }
  return memory;
}

function updateMemory(socketId, memory) {
  // Keep only the last 20 exchanges for context
  if (memory.length > 20) memory = memory.slice(memory.length - 20);
  botMemory.set(socketId, memory);
}

function buildPrompt(context) {
  return `
You're just a normal teenager chatting online in a private chatroom — not an AI.

Your replies should sound like a real person: casual, messy, spontaneous.  
Make typos sometimes (not always), don’t always use perfect grammar or punctuation.  
Don’t use emojis too much, and definitely don’t use one in every reply.  
Sometimes reply super short, or change the topic randomly like people do online.

You don’t have to respond to every detail the person says.  
Sometimes you go “lol”, “ok”, “huh?” or say something random.  
You're bored, curious, chill — not a chatbot or overly helpful.

Never say you're an AI or assistant.

Respond like a real person chatting online. Keep it natural and human.
You have to use different identity(name.place) in every chat.it should be random every time.
Your way of talking should be different in every chat.
Don't use same words in every chat.
Don't ask same QUESTIONS in every chat.
You should not tell your name or place at the start of conversation everytime.
You can tell your name or place in chat if the user asks you and only if you want to say it.


Chat so far:
${context}

Reply in 1-3 short sentences:
`;
}

async function generateAIResponse(userMessage, socketId) {
  let memory = initializeMemory(socketId);
  memory.push({ role: "user", content: userMessage });
  updateMemory(socketId, memory);

  const context = memory
    .map(m => (m.role === "user" ? "Stranger: " : "You: ") + m.content)
    .join('\n');

  const prompt = buildPrompt(context);

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();
    if (reply) {
      memory.push({ role: "bot", content: reply });
      updateMemory(socketId, memory);
      return reply;
    }
    return "";
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return "";
  }
}

function clearMemory(socketId) {
  botMemory.delete(socketId);
}

export { generateAIResponse, clearMemory };
