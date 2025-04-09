const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '请提供模块标题'],
    trim: true
  },
  description: {
    type: String,
    required: [true, '请提供模块描述']
  },
  language: {
    type: String,
    default: 'en-zh'
  },
  icon: {
    type: String,
    default: 'menu_book'
  },
  totalTerms: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Module', ModuleSchema); 