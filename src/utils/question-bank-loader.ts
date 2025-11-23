import { Question, QuestionBank } from '@/types';
import { defaultQuestionBank } from '@/data/question-banks/default';

/**
 * Dynamic question bank loader
 * Loads question banks from /public/question-banks/ directory
 * Falls back to built-in default bank if loading fails
 */

/**
 * Get URL query parameters
 */
export const getQueryParams = (): URLSearchParams => {
  return new URLSearchParams(window.location.search);
};

/**
 * Load question bank dynamically from JSON file
 * @param bankId - The ID of the question bank to load
 * @returns Promise with the loaded question bank
 */
const loadQuestionBankFromFile = async (bankId: string): Promise<QuestionBank> => {
  try {
    // Try to load from public/question-banks/ directory
    const response = await fetch(`/question-banks/${bankId}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to load question bank: ${response.statusText}`);
    }
    
    const bank: QuestionBank = await response.json();
    
    // Validate the loaded bank
    if (!bank.id || !bank.name || !Array.isArray(bank.questions)) {
      throw new Error('Invalid question bank format');
    }
    
    console.log(`✅ Loaded question bank: ${bank.name} (${bank.questions.length} questions)`);
    return bank;
  } catch (error) {
    console.error(`❌ Failed to load question bank "${bankId}":`, error);
    throw error;
  }
};

/**
 * Load questions based on URL query parameter
 * Supports: ?bank=technology or ?bank=custom-bank-name
 * 
 * To add a new question bank:
 * 1. Create a JSON file in /public/question-banks/ directory
 * 2. Name it with the bank ID (e.g., technology.json)
 * 3. Access it via ?bank=technology
 */
export const loadQuestionBank = async (): Promise<{
  questions: Question[];
  bankInfo: QuestionBank;
  error?: string;
}> => {
  const params = getQueryParams();
  const bankId = params.get('bank') || 'default';

  console.log('🔍 Loading question bank:', bankId);

  // If default bank is requested, use the built-in one
  if (bankId === 'default') {
    console.log(`✅ Loaded built-in default bank (${defaultQuestionBank.questions?.length || 0} questions)`);
    return {
      questions: defaultQuestionBank.questions || [],
      bankInfo: defaultQuestionBank,
    };
  }

  // Try to load the requested bank dynamically
  try {
    const bank = await loadQuestionBankFromFile(bankId);
    return {
      questions: bank.questions || [],
      bankInfo: bank,
    };
  } catch (error) {
    console.warn(`⚠️ Question bank "${bankId}" not found. Using default.`);
    return {
      questions: defaultQuestionBank.questions || [],
      bankInfo: defaultQuestionBank,
      error: `Question bank "${bankId}" not found. Loaded default questions instead.`,
    };
  }
};

/**
 * Get list of available question banks from the server
 * This requires a manifest file at /public/question-banks/manifest.json
 */
export const getAvailableQuestionBanks = async (): Promise<QuestionBank[]> => {
  try {
    const response = await fetch('/question-banks/manifest.json');
    
    if (!response.ok) {
      throw new Error('Manifest not found');
    }
    
    const manifest: { banks: string[] } = await response.json();
    
    // Load metadata for each bank
    const banks = await Promise.all(
      manifest.banks.map(async (bankId) => {
        try {
          const bank = await loadQuestionBankFromFile(bankId);
          return bank;
        } catch {
          return null;
        }
      })
    );
    
    // Filter out failed loads and add default bank
    return [defaultQuestionBank, ...banks.filter((b): b is QuestionBank => b !== null)];
  } catch (error) {
    console.warn('Could not load question bank manifest:', error);
    // Return only the default bank if manifest loading fails
    return [defaultQuestionBank];
  }
};
