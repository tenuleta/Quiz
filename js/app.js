// Main Application Logic
class QuizApp {
  constructor() {
    this.quizData = [];
    this.currentQuestion = 0;
    this.score = 0;
    this.timeLeft = 30;
    this.timerInterval = null;
    this.questionStartTime = 0;
    this.totalTimeSpent = 0;
    this.correctAnswers = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.questionTimes = [];
    this.isAnswered = false;
    this.currentSection = 'quiz-section';
  }

  // Initialize the app
  init() {
    this.loadStats();
    this.setupEventListeners();
    this.showSection('quiz-section');
    this.addSampleData();
  }

  // Add sample data for testing
  addSampleData() {
    const history = storage.getQuizHistory();
    if (history.length === 0) {
      // Add some sample quiz results for demonstration
      const sampleResults = [
        { score: 4, totalQuestions: 5, accuracy: 80, avgTime: 15.2, points: 450, category: 'Science', difficulty: 'medium' },
        { score: 3, totalQuestions: 5, accuracy: 60, avgTime: 18.5, points: 350, category: 'History', difficulty: 'easy' },
        { score: 5, totalQuestions: 5, accuracy: 100, avgTime: 12.1, points: 550, category: 'Geography', difficulty: 'hard' }
      ];

      sampleResults.forEach(result => {
        storage.addQuizResult(result);
      });
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
        this.showSection(section);
      });
    });
  }

  // Show specific section
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.style.display = 'block';
      this.currentSection = sectionId;

      // Initialize section-specific content
      if (sectionId === 'dashboard-section') {
        dashboard.init();
      } else if (sectionId === 'manage-section') {
        questionManager.updateQuestionsTable();
      }
    }
  }

  // Load and display stats
  loadStats() {
    const stats = storage.getStats();
    document.getElementById('high-score-display').textContent = stats.highScore;
    document.getElementById('total-points-display').textContent = stats.totalPoints;
    document.getElementById('streak-display').textContent = stats.maxStreak;
  }

  // Update stats display
  updateStatsDisplay() {
    document.getElementById('streak-display').textContent = this.streak;
  }

  // Start quiz
  async startQuiz() {
    const category = document.getElementById("category").value;
    const difficulty = document.getElementById("difficulty").value;
    const amount = parseInt(document.getElementById("amount").value) || 5;

    // Reset game state
    this.resetGameState();

    try {
      this.quizData = await api.fetchQuestions({
        category,
        difficulty,
        amount
      });

      document.getElementById("settings").style.display = "none";
      document.getElementById("quiz").style.display = "block";
      document.getElementById("total-q").textContent = this.quizData.length;
      this.showQuestion();
    } catch (error) {
      showAlert("Error starting quiz. Please try again.", "error");
    }
  }

  // Reset game state
  resetGameState() {
    this.currentQuestion = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.totalTimeSpent = 0;
    this.questionTimes = [];
    this.isAnswered = false;
  }

  // Show current question
  showQuestion() {
    const questionObj = this.quizData[this.currentQuestion];
    const questionText = document.getElementById("question-text");
    const answersGrid = document.getElementById("answers-grid");
    const currentQ = document.getElementById("current-q");
    const progressBar = document.getElementById("progress-bar");

    // Update progress
    currentQ.textContent = this.currentQuestion + 1;
    const progressPercentage = ((this.currentQuestion + 1) / this.quizData.length) * 100;
    progressBar.style.width = progressPercentage + '%';

    // Display question
    questionText.textContent = decodeHTML(questionObj.question);

    // Prepare answers
    const correct = decodeHTML(questionObj.correct_answer);
    const incorrect = questionObj.incorrect_answers.map(ans => decodeHTML(ans));
    const allAnswers = [...incorrect, correct].sort(() => Math.random() - 0.5);

    // Create answer buttons
    answersGrid.innerHTML = "";
    allAnswers.forEach(answer => {
      const btn = document.createElement("button");
      btn.className = "btn btn-outline-primary mb-2";
      btn.textContent = answer;
      btn.onclick = () => this.selectAnswer(answer, correct, btn);
      answersGrid.appendChild(btn);
    });

    // Start timer
    this.startTimer();
  }

  // Start timer
  startTimer() {
    this.timeLeft = 30;
    this.questionStartTime = Date.now();
    this.isAnswered = false;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        if (!this.isAnswered) {
          this.timeUp();
        }
      }
    }, 1000);
  }

  // Update timer display
  updateTimerDisplay() {
    document.getElementById('timer-text').textContent = this.timeLeft;
  }

  // Handle time up
  timeUp() {
    this.isAnswered = true;
    this.streak = 0;
    this.updateStatsDisplay();

    const correctAnswer = decodeHTML(this.quizData[this.currentQuestion].correct_answer);
    showAlert(`⏰ Time's up! Correct answer: ${correctAnswer}`, "warning");

    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  // Handle answer selection
  selectAnswer(selectedAnswer, correctAnswer, selectedBtn) {
    if (this.isAnswered) return;

    this.isAnswered = true;
    clearInterval(this.timerInterval);

    // Calculate time taken
    const timeTaken = (Date.now() - this.questionStartTime) / 1000;
    this.questionTimes.push(timeTaken);
    this.totalTimeSpent += timeTaken;

    // Disable all buttons
    const buttons = document.querySelectorAll('#answers-grid button');
    buttons.forEach(btn => btn.disabled = true);

    // Check answer
    if (selectedAnswer === correctAnswer) {
      selectedBtn.classList.remove('btn-outline-primary');
      selectedBtn.classList.add('btn-success');
      this.score++;
      this.correctAnswers++;
      this.streak++;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      showAlert("✅ Correct!", "success");
    } else {
      selectedBtn.classList.remove('btn-outline-primary');
      selectedBtn.classList.add('btn-danger');
      this.streak = 0;
      
      // Show correct answer
      buttons.forEach(btn => {
        if (btn.textContent === correctAnswer) {
          btn.classList.remove('btn-outline-primary');
          btn.classList.add('btn-success');
        }
      });
      
      showAlert(`❌ Wrong! Correct: ${correctAnswer}`, "error");
    }

    this.updateStatsDisplay();

    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  // Move to next question
  nextQuestion() {
    this.currentQuestion++;
    if (this.currentQuestion < this.quizData.length) {
      this.showQuestion();
    } else {
      this.endQuiz();
    }
  }

  // Skip current question
  skipQuestion() {
    if (this.isAnswered) return;

    this.isAnswered = true;
    clearInterval(this.timerInterval);
    this.streak = 0;
    this.updateStatsDisplay();

    const correctAnswer = decodeHTML(this.quizData[this.currentQuestion].correct_answer);
    showAlert(`⏭️ Skipped! Answer: ${correctAnswer}`, "info");

    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  // End quiz and show results
  endQuiz() {
    clearInterval(this.timerInterval);

    const accuracy = Math.round((this.correctAnswers / this.quizData.length) * 100);
    const avgTime = this.totalTimeSpent / this.quizData.length;
    const pointsEarned = this.score * 100 + (this.maxStreak * 50);

    // Save quiz result
    const quizResult = {
      score: this.score,
      totalQuestions: this.quizData.length,
      accuracy: accuracy,
      avgTime: avgTime.toFixed(1),
      points: pointsEarned,
      category: document.getElementById("category").selectedOptions[0]?.text || 'Mixed',
      difficulty: document.getElementById("difficulty").value || 'mixed'
    };

    storage.addQuizResult(quizResult);
    storage.saveStats(pointsEarned, pointsEarned, this.maxStreak);

    // Update displays
    document.getElementById("quiz").style.display = "none";
    document.getElementById("result").style.display = "block";

    document.getElementById("result-title").textContent = 
      accuracy >= 80 ? "Outstanding!" : accuracy >= 60 ? "Well Done!" : "Keep Learning!";
    document.getElementById("result-score").textContent = 
      `You scored ${this.score} out of ${this.quizData.length} questions correctly`;
    document.getElementById("accuracy-display").textContent = accuracy + "%";
    document.getElementById("avg-time-display").textContent = avgTime.toFixed(1) + "s";
    document.getElementById("points-earned").textContent = pointsEarned;

    this.loadStats();
  }

  // Restart quiz
  restartQuiz() {
    document.getElementById("result").style.display = "none";
    document.getElementById("settings").style.display = "block";
    this.loadStats();
  }

  // New quiz (reload page)
  newQuiz() {
    location.reload();
  }
}

// Global functions for HTML onclick handlers
function startQuiz() {
  app.startQuiz();
}

function skipQuestion() {
  app.skipQuestion();
}

function restartQuiz() {
  app.restartQuiz();
}

function newQuiz() {
  app.newQuiz();
}

function showSection(sectionId) {
  app.showSection(sectionId);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.app = new QuizApp();
  app.init();
});
