const mongoose = require('mongoose');

const TermSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  term: {
    type: String,
    required: [true, '请提供术语名称'],
    trim: true
  },
  definition: {
    type: String,
    required: [true, '请提供英文定义']
  },
  foreignTerm: {
    type: String,
    required: [true, '请提供中文术语']
  },
  notes: {
    type: String
  },
  image: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Term', TermSchema); 