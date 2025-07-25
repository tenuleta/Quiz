// Dashboard and Charts Management
class DashboardManager {
  constructor() {
    this.charts = {};
  }

  // Initialize dashboard
  init() {
    this.createPerformanceChart();
    this.createCategoryChart();
    this.updateHistoryTable();
  }

  // Create performance chart
  createPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    const history = storage.getQuizHistory();
    const last10 = history.slice(0, 10).reverse();

    const data = {
      labels: last10.map((_, index) => `Quiz ${index + 1}`),
      datasets: [{
        label: 'Score %',
        data: last10.map(quiz => quiz.accuracy || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    };

    this.charts.performance = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Recent Performance'
          }
        }
      }
    });
  }

  // Create category performance chart
  createCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const history = storage.getQuizHistory();
    const categoryStats = {};

    history.forEach(quiz => {
      const category = quiz.category || 'Unknown';
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, correct: 0 };
      }
      categoryStats[category].total += quiz.totalQuestions || 0;
      categoryStats[category].correct += quiz.score || 0;
    });

    const categories = Object.keys(categoryStats);
    const accuracies = categories.map(cat => 
      categoryStats[cat].total > 0 
        ? Math.round((categoryStats[cat].correct / categoryStats[cat].total) * 100)
        : 0
    );

    this.charts.category = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: accuracies,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Category Performance'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // Update history table
  updateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    const history = storage.getQuizHistory();
    tbody.innerHTML = '';

    if (history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No quiz history yet</td></tr>';
      return;
    }

    history.forEach(quiz => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(quiz.date).toLocaleDateString()}</td>
        <td>${quiz.category || 'Mixed'}</td>
        <td>${quiz.score}/${quiz.totalQuestions}</td>
        <td>${quiz.accuracy}%</td>
        <td>${quiz.points}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // Update charts with new data
  updateCharts() {
    if (this.charts.performance) {
      this.charts.performance.destroy();
    }
    if (this.charts.category) {
      this.charts.category.destroy();
    }
    this.createPerformanceChart();
    this.createCategoryChart();
    this.updateHistoryTable();
  }

  // Get statistics summary
  getStatsSummary() {
    const history = storage.getQuizHistory();
    const stats = storage.getStats();

    if (history.length === 0) {
      return {
        totalQuizzes: 0,
        averageAccuracy: 0,
        totalQuestions: 0,
        favoriteCategory: 'None'
      };
    }

    const totalQuizzes = history.length;
    const totalQuestions = history.reduce((sum, quiz) => sum + (quiz.totalQuestions || 0), 0);
    const totalCorrect = history.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
    const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Find favorite category
    const categoryCount = {};
    history.forEach(quiz => {
      const category = quiz.category || 'Mixed';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'None'
    );

    return {
      totalQuizzes,
      averageAccuracy,
      totalQuestions,
      favoriteCategory,
      ...stats
    };
  }
}

// Question Management
class QuestionManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateQuestionsTable();
  }

  setupEventListeners() {
    const form = document.getElementById('questionForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addQuestion();
      });
    }
  }

  addQuestion() {
    const question = document.getElementById('questionInput').value.trim();
    const correctAnswer = document.getElementById('correctAnswer').value.trim();
    const wrongAnswer1 = document.getElementById('wrongAnswer1').value.trim();
    const wrongAnswer2 = document.getElementById('wrongAnswer2').value.trim();
    const wrongAnswer3 = document.getElementById('wrongAnswer3').value.trim();
    const category = document.getElementById('questionCategory').value;

    if (!question || !correctAnswer || !wrongAnswer1 || !wrongAnswer2 || !wrongAnswer3) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    const newQuestion = {
      question,
      correctAnswer,
      wrongAnswer1,
      wrongAnswer2,
      wrongAnswer3,
      category,
      difficulty: 'medium'
    };

    storage.addCustomQuestion(newQuestion);
    this.updateQuestionsTable();
    document.getElementById('questionForm').reset();
    showAlert('Question added successfully!', 'success');
  }

  updateQuestionsTable() {
    const tbody = document.getElementById('questionsTableBody');
    if (!tbody) return;

    const questions = storage.getCustomQuestions();
    tbody.innerHTML = '';

    if (questions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">No custom questions yet</td></tr>';
      return;
    }

    questions.forEach(question => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${question.question}</td>
        <td><span class="badge bg-secondary">${question.category}</span></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="questionManager.deleteQuestion(${question.id})">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question?')) {
      storage.deleteCustomQuestion(id);
      this.updateQuestionsTable();
      showAlert('Question deleted successfully!', 'success');
    }
  }
}

// Create global instances
window.dashboard = new DashboardManager();
window.questionManager = new QuestionManager();
