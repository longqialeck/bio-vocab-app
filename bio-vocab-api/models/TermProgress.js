const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TermProgress = sequelize.define('TermProgress', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  termId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Terms',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('new', 'learning', 'reviewing', 'mastered'),
    defaultValue: 'new'
  },
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  incorrectCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastReviewed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextReviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['termId'] },
    { fields: ['userId', 'termId'], unique: true },
    { fields: ['status'] },
    { fields: ['nextReviewDate'] }
  ]
});

module.exports = TermProgress; 