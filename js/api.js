// API Management
class APIManager {
  constructor() {
    this.baseURL = 'https://opentdb.com/api.php';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Fetch questions from API with caching
  async fetchQuestions(params) {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = this.buildURL(params);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.response_code === 0) {
        // Cache successful response
        this.cache.set(cacheKey, {
          data: data.results,
          timestamp: Date.now()
        });
        return data.results;
      } else {
        throw new Error(this.getErrorMessage(data.response_code));
      }
    } catch (error) {
      console.error('API Error:', error);
      
      // Fallback to custom questions if API fails
      const customQuestions = storage.getCustomQuestions();
      if (customQuestions.length > 0) {
        return this.formatCustomQuestions(customQuestions, params.amount || 5);
      }
      
      // Fallback to default questions
      return this.getDefaultQuestions(params.amount || 5);
    }
  }

  // Build API URL
  buildURL(params) {
    let url = `${this.baseURL}?amount=${params.amount || 5}&type=multiple`;
    
    if (params.category) {
      url += `&category=${params.category}`;
    }
    
    if (params.difficulty) {
      url += `&difficulty=${params.difficulty}`;
    }
    
    return url;
  }

  // Get error message for response codes
  getErrorMessage(code) {
    const messages = {
      1: 'No results found. Try different settings.',
      2: 'Invalid parameter. Please check your settings.',
      3: 'Token not found.',
      4: 'Token empty.',
      5: 'Rate limit exceeded. Please wait.'
    };
    return messages[code] || 'Unknown error occurred.';
  }

  // Format custom questions to match API format
  formatCustomQuestions(questions, amount) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, amount);
    
    return selected.map(q => ({
      question: q.question,
      correct_answer: q.correctAnswer,
      incorrect_answers: [q.wrongAnswer1, q.wrongAnswer2, q.wrongAnswer3],
      category: q.category || 'Custom',
      difficulty: q.difficulty || 'medium',
      type: 'multiple'
    }));
  }

  // Default fallback questions
  getDefaultQuestions(amount) {
    const defaultQuestions = [
      {
        question: "What is the capital of France?",
        correct_answer: "Paris",
        incorrect_answers: ["London", "Berlin", "Madrid"],
        category: "Geography",
        difficulty: "easy",
        type: "multiple"
      },
      {
        question: "What is 2 + 2?",
        correct_answer: "4",
        incorrect_answers: ["3", "5", "6"],
        category: "Mathematics",
        difficulty: "easy",
        type: "multiple"
      },
      {
        question: "Who painted the Mona Lisa?",
        correct_answer: "Leonardo da Vinci",
        incorrect_answers: ["Pablo Picasso", "Vincent van Gogh", "Michelangelo"],
        category: "Art",
        difficulty: "medium",
        type: "multiple"
      },
      {
        question: "What is the largest planet in our solar system?",
        correct_answer: "Jupiter",
        incorrect_answers: ["Saturn", "Neptune", "Earth"],
        category: "Science",
        difficulty: "easy",
        type: "multiple"
      },
      {
        question: "In which year did World War II end?",
        correct_answer: "1945",
        incorrect_answers: ["1944", "1946", "1943"],
        category: "History",
        difficulty: "medium",
        type: "multiple"
      }
    ];

    const shuffled = defaultQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, amount);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache info
  getCacheInfo() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Utility functions
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function showAlert(message, type = "info") {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 3000);
}

// Create global instance
window.api = new APIManager();
