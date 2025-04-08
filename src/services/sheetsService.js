import axios from 'axios'

// In a real app, these would be environment variables
const API_KEY = 'YOUR_GOOGLE_API_KEY'
const SHEET_ID = 'YOUR_SHEET_ID'

/**
 * This service is a simplified mock version of what would connect to Google Sheets API
 * In production, proper authentication and API calls would be implemented
 */
class SheetsService {
  async getVocabularyData(moduleId) {
    try {
      // In a real app, this would call Google Sheets API using axios
      // Example of how it would work:
      // const response = await axios.get(
      //   `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${moduleId}!A1:Z100?key=${API_KEY}`
      // )
      
      // For the prototype, we'll just return mock data
      return this.getMockData(moduleId)
    } catch (error) {
      console.error('Error fetching vocabulary data:', error)
      return []
    }
  }
  
  async saveUserProgress(userId, moduleId, progress) {
    try {
      // Mock implementation for saving progress
      console.log('Saving progress for user', userId, 'in module', moduleId, ':', progress)
      // Would send data to Google Sheets in production
      return true
    } catch (error) {
      console.error('Error saving user progress:', error)
      return false
    }
  }
  
  getMockData(moduleId) {
    const mockData = {
      'cell-structure': [
        {
          id: 1,
          term: 'Cell Membrane',
          definition: 'Also called the plasma membrane, it is the thin layer of protein and fat that surrounds the cell.',
          foreignTerm: '细胞膜',
          image: null
        },
        {
          id: 2,
          term: 'Cytoplasm',
          definition: 'The fluid inside the cell that holds the organelles in place.',
          foreignTerm: '细胞质',
          image: null
        },
        {
          id: 3,
          term: 'Nucleus',
          definition: 'The cell\'s control center, containing the cell\'s DNA and directing cell activities.',
          foreignTerm: '细胞核',
          image: null
        },
        {
          id: 4,
          term: 'Ribosome',
          definition: 'The sites of protein synthesis.',
          foreignTerm: '核糖体',
          image: null
        },
        {
          id: 5,
          term: 'Mitochondria',
          definition: 'The powerhouse of the cell, where cellular respiration takes place.',
          foreignTerm: '线粒体',
          image: null
        }
      ],
      'dna-genetics': [
        {
          id: 1,
          term: 'DNA',
          definition: 'Deoxyribonucleic acid, the hereditary material in humans and almost all other organisms.',
          foreignTerm: '脱氧核糖核酸',
          image: null
        },
        {
          id: 2,
          term: 'Gene',
          definition: 'The basic physical and functional unit of heredity.',
          foreignTerm: '基因',
          image: null
        },
        {
          id: 3,
          term: 'Chromosome',
          definition: 'A thread-like structure of nucleic acids and protein found in the nucleus of most living cells.',
          foreignTerm: '染色体',
          image: null
        }
      ]
    }
    
    return mockData[moduleId] || []
  }
}

export default new SheetsService() 