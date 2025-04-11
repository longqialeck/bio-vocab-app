const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Progress = sequelize.define('Progress', {
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
  moduleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Modules',
      key: 'id'
    }
  },
  completedTermIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  progress: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  lastStudied: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['moduleId'] },
    { fields: ['userId', 'moduleId'], unique: true }
  ]
});

module.exports = Progress; 