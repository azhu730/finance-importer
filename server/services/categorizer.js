const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Categorize a batch of transactions using Claude.
 * @param {Array} transactions - raw transaction rows from DB
 * @param {Array} categories   - [{category, sub_category}] from DB
 * @returns {Array} [{id, category, subCategory}]
 */
async function categorizeBatch(transactions, categories) {
  if (!transactions.length) return [];

  const catList = categories
    .map(r => `${r.category} > ${r.sub_category}`)
    .join('\n');

  const txLines = transactions
    .map((r, i) => `${i + 1}. "${r.transaction}" | upstream: "${r.upstream_category}" | source: ${r.payment} | amount: $${r.amount}`)
    .join('\n');

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a personal finance categorizer. Assign each transaction the best matching Category and Sub-Category from the list below.

AVAILABLE CATEGORIES (format: Category > Sub-Category):
${catList}

TRANSACTIONS TO CATEGORIZE:
${txLines}

Rules:
- You MUST use only the exact Category and Sub-Category strings listed above.
- If genuinely uncertain, pick the closest match — never leave blank.
- Respond ONLY with a valid JSON array. No explanation, no markdown fences.

Format: [{"index":1,"category":"Food","subCategory":"Groceries"}, ...]`,
    }],
  });

  const raw     = message.content[0].text.trim().replace(/```json|```/g, '').trim();
  const results = JSON.parse(raw);

  return results.map(({ index, category, subCategory }) => ({
    id:          transactions[index - 1]?.id,
    category,
    subCategory,
  })).filter(r => r.id);
}

module.exports = { categorizeBatch };
