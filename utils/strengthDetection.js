export const getPasswordStrength = (password) => {
  let points = 0;
  let rulesEnforced = 0;

  const rules = [
    { test: (p) => p.length >= 8, val: 10 },               // Length
    { test: (p) => /[a-z]/.test(p), val: 5 },              // Lowercase
    { test: (p) => /[A-Z]/.test(p), val: 5 },              // Uppercase
    { test: (p) => /\d/.test(p), val: 5 },                 // Digit
    { test: (p) => /[^A-Za-z0-9]/.test(p), val: 10 },      // Symbol
    { test: (p) => new Set(p).size >= 5, val: 5 }          // Unique Chars
  ];

  rules.forEach(rule => {
    if (rule.test(password)) {
      points += rule.val;
      rulesEnforced += 1;
    }
  });

  const finalScore = points + (rulesEnforced * 10);
  const percentage = Math.min(finalScore, 100);
  let strength;
  // Strength Enum Logic
  if (percentage == 100) strength = "VERY_STRONG";
  else if (percentage >= 80) strength = "STRONG";
  else if (percentage >= 60) strength = "GOOD";
  else if (percentage >= 40) strength = "FAIR";
  else strength= "WEAK";

  return strength;
};