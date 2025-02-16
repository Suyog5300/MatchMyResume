// content.js
function extractSkillsFromText(text) {
  // Common technical skills to look for
  const commonSkills = [
    'javascript', 'react', 'node', 'mongodb', 'express',
    'html', 'css', 'git', 'aws', 'docker', 'sql',
    'python', 'java', 'typescript', 'angular', 'vue',
    // Add more skills as needed
  ];

  const foundSkills = new Set();
  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}

// content.js
// content.js
console.log('Content script loaded');

function extractJobDescription() {
  const selectors = [
    '.jobs-description-content__text',
    '.jobs-box__html-content > span',
    '#job-details'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.innerText.trim();
    }
  }
  return '';
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === 'getJobDescription') {
    const description = extractJobDescription();
    console.log('Job description extracted:', description);
    sendResponse({ jobDescription: description });
  }
  return true; // Keep the message channel open for async response
});