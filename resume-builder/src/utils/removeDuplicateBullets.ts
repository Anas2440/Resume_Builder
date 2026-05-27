const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "using",
  "with",
  "while"
])

const actionVerbs = /^(built|delivered|integrated|implemented|optimized|developed|launched|improved|designed|owned|led|created|validated|automated|reduced|increased)\b/i

function normalizeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, "")
    .replace(/(ing|ed|es|s)$/i, "")
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map(normalizeToken)
    .filter(token => token.length > 1 && !stopWords.has(token))
}

function cosineSimilarity(leftTokens: string[], rightTokens: string[]) {
  const left = new Map<string, number>()
  const right = new Map<string, number>()

  leftTokens.forEach(token => left.set(token, (left.get(token) ?? 0) + 1))
  rightTokens.forEach(token => right.set(token, (right.get(token) ?? 0) + 1))

  const allTokens = new Set([...left.keys(), ...right.keys()])
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  allTokens.forEach(token => {
    const leftCount = left.get(token) ?? 0
    const rightCount = right.get(token) ?? 0
    dot += leftCount * rightCount
    leftMagnitude += leftCount * leftCount
    rightMagnitude += rightCount * rightCount
  })

  if (!leftMagnitude || !rightMagnitude) {
    return 0
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

function jaccardSimilarity(leftTokens: string[], rightTokens: string[]) {
  const left = new Set(leftTokens)
  const right = new Set(rightTokens)
  const intersection = [...left].filter(token => right.has(token)).length
  const union = new Set([...left, ...right]).size

  return union ? intersection / union : 0
}

export function bulletSimilarity(left: string, right: string) {
  const leftTokens = tokenize(left)
  const rightTokens = tokenize(right)

  if (!leftTokens.length || !rightTokens.length) {
    return 0
  }

  return cosineSimilarity(leftTokens, rightTokens) * 0.65 + jaccardSimilarity(leftTokens, rightTokens) * 0.35
}

function bulletStrengthScore(bullet: string) {
  let score = bullet.trim().length

  if (actionVerbs.test(bullet)) score += 35
  if (/\b\d+[%+]?|\b\d+x\b|users|downloads|latency|revenue|performance|load time/i.test(bullet)) score += 45
  if (/\b(api|swift|uikit|firebase|ble|socket|testing|performance|architecture|realtime)\b/i.test(bullet)) score += 20

  return score
}

function chooseBetterBullet(left: string, right: string) {
  return bulletStrengthScore(right) > bulletStrengthScore(left) ? right : left
}

export function removeDuplicateBullets(bullets: string[], maxBullets = 6) {
  const result: string[] = []

  bullets
    .map(bullet => bullet.replace(/^[-•]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .forEach(candidate => {
      const duplicateIndex = result.findIndex(existing => bulletSimilarity(existing, candidate) > 0.85)

      if (duplicateIndex >= 0) {
        result[duplicateIndex] = chooseBetterBullet(result[duplicateIndex], candidate)
        return
      }

      result.push(candidate)
    })

  return result.slice(0, maxBullets)
}
