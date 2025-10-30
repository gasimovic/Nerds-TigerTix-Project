// In this File: 
// Sprint 2 Task 1-Natural-Language Event Query & Booking 
// Sprint 2 Task 1 - Error Handling & Fallback

//uses OpenAI's API
const OpenAI = require('openai');
const { listAvailableEvents } = require('../models/bookingModel');

// Use model from env
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

//converts words to numbers for parsing
const WORD_NUMS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

// Fallback parser if no LLM or low confidence
function fallbackParse(text, events) {
  const lower = String(text || '').toLowerCase();
  let qty = 1;
  const digitMatch = lower.match(/(\d{1,2})\s*(ticket|tickets)?/);
  if (digitMatch) qty = parseInt(digitMatch[1], 10);
  else {
    const word = Object.keys(WORD_NUMS).find(w => new RegExp(`\\b${w}\\b`).test(lower));
    if (word) qty = WORD_NUMS[word];
  }

  // find an event name by contains match
  let matchedEvent = null;
  for (const ev of events) {
    if (lower.includes(ev.name.toLowerCase())) { matchedEvent = ev; break; }
  }

  // fallback keywords for intent
  const intent = /\b(book|buy|purchase|reserve)\b/.test(lower) ? 'book' : 'unknown';

  // return parsed result
  return {
    intent,
    eventName: matchedEvent ? matchedEvent.name : null,
    eventId: matchedEvent ? matchedEvent.id : null,
    quantity: qty,
    source: 'fallback'
  };
}

// LLM-based parser
async function parseWithLlm(text, events) {
  if (!openai) {
    return fallbackParse(text, events);
  }
// prompt for LLM
  const eventList = events.map(e => `- ${e.name} (id ${e.id}, ${e.tickets_available} available)`).join('\n');
  const system = `You are a booking parser. Extract user intent, event, and ticket quantity from text.
Only consider these events:
${eventList}
Return strict JSON: {"intent":"book|unknown","eventName":string|null,"eventId":number|null,"quantity":number,"confidence":0..1}
If unsure, set intent:"unknown" and confidence:0.2`;
// call OpenAI
  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: String(text || '') }
      ],
      temperature: 0.2
    });
    const content = resp.choices?.[0]?.message?.content?.trim() || '{}';
    let parsed = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    // normalize parsed
    const normalized = {
      intent: parsed.intent || 'unknown',
      eventName: parsed.eventName || null,
      eventId: typeof parsed.eventId === 'number' ? parsed.eventId : null,
      quantity: Number.isFinite(parsed.quantity) ? parsed.quantity : 1,
      confidence: Number.isFinite(parsed.confidence) ? parsed.confidence : 0
    };

    // if low confidence or missing event, fall back
    if (normalized.confidence < 0.6 || (!normalized.eventId && !normalized.eventName)) {
      const fb = fallbackParse(text, events);
      return { ...fb, confidence: normalized.confidence, source: 'llm+fallback' };
    }
    return { ...normalized, source: 'llm' };
  } catch (e) {
    // hard failure -> fallback
    return fallbackParse(text, events);
  }
}

module.exports = { parseWithLlm, fallbackParse };