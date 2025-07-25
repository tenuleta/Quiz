// Local Storage Management
class StorageManager {
  constructor() {
    this.keys = {
      HIGH_SCORE: 'trivia_high_score',
      TOTAL_POINTS: 'trivia_total_points',
      MAX_STREAK: 'trivia_max_streak',
      QUIZ_HISTORY: 'trivia_quiz_history',
      CUSTOM_QUESTIONS: 'trivia_custom_questions',
      USER_PROFILE: 'trivia_user_profile'
    };
  }

  // Get data from localStorage
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // Set data to localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }

  // Remove data from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // Get stats
  getStats() {
    return {
      highScore: this.get(this.keys.HIGH_SCORE) || 0,
      totalPoints: this.get(this.keys.TOTAL_POINTS) || 0,
      maxStreak: this.get(this.keys.MAX_STREAK) || 0
    };
  }

  // Save stats
  saveStats(newScore, pointsEarned, streak) {
    const stats = this.getStats();
    
    if (newScore > stats.highScore) {
      this.set(this.keys.HIGH_SCORE, newScore);
    }
    
    if (streak > stats.maxStreak) {
      this.set(this.keys.MAX_STREAK, streak);
    }
    
    const newTotalPoints = stats.totalPoints + pointsEarned;
    this.set(this.keys.TOTAL_POINTS, newTotalPoints);
    
    return this.getStats();
  }

  // Quiz History CRUD
  getQuizHistory() {
    return this.get(this.keys.QUIZ_HISTORY) || [];
  }

  addQuizResult(result) {
    const history = this.getQuizHistory();
    const newResult = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...result
    };
    history.unshift(newResult);
    
    // Keep only last 50 results
    if (history.length > 50) {
      history.splice(50);
    }
    
    this.set(this.keys.QUIZ_HISTORY, history);
    return newResult;
  }

  deleteQuizResult(id) {
    const history = this.getQuizHistory();
    const filtered = history.filter(result => result.id !== id);
    this.set(this.keys.QUIZ_HISTORY, filtered);
    return filtered;
  }

  // Custom Questions CRUD
  getCustomQuestions() {
    return this.get(this.keys.CUSTOM_QUESTIONS) || [];
  }

  addCustomQuestion(question) {
    const questions = this.getCustomQuestions();
    const newQuestion = {
      id: Date.now(),
      created: new Date().toISOString(),
      ...question
    };
    questions.push(newQuestion);
    this.set(this.keys.CUSTOM_QUESTIONS, questions);
    return newQuestion;
  }

  updateCustomQuestion(id, updates) {
    const questions = this.getCustomQuestions();
    const index = questions.findIndex(q => q.id === id);
    if (index !== -1) {
      questions[index] = { ...questions[index], ...updates };
      this.set(this.keys.CUSTOM_QUESTIONS, questions);
      return questions[index];
    }
    return null;
  }

  deleteCustomQuestion(id) {
    const questions = this.getCustomQuestions();
    const filtered = questions.filter(q => q.id !== id);
    this.set(this.keys.CUSTOM_QUESTIONS, filtered);
    return filtered;
  }

  // User Profile CRUD
  getUserProfile() {
    return this.get(this.keys.USER_PROFILE) || {
      name: 'Player',
      avatar: '🧠',
      preferences: {
        defaultCategory: '',
        defaultDifficulty: '',
        defaultQuestions: 5
      }
    };
  }

  updateUserProfile(updates) {
    const profile = this.getUserProfile();
    const updated = { ...profile, ...updates };
    this.set(this.keys.USER_PROFILE, updated);
    return updated;
  }

  // Clear all data
  clearAllData() {
    Object.values(this.keys).forEach(key => {
      this.remove(key);
    });
  }

  // Export data
  exportData() {
    const data = {};
    Object.entries(this.keys).forEach(([name, key]) => {
      data[name] = this.get(key);
    });
    return data;
  }

  // Import data
  importData(data) {
    Object.entries(data).forEach(([name, value]) => {
      if (this.keys[name] && value !== null) {
        this.set(this.keys[name], value);
      }
    });
  }
}

// Create global instance
window.storage = new StorageManager();
