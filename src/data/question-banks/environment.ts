import { QuestionBank, QuestionType } from '@/types';

export const environmentQuestionBank: QuestionBank = {
  id: 'environment',
  name: 'Environment',
  description: 'Questions about environmental issues, sustainability, and nature',
  author: 'IELTS Practice Team',
  version: '1.0',
  questions: [
    {
      id: 'env1',
      type: QuestionType.Part1,
      text: 'Do you think environmental protection is important?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 20,
    },
    {
      id: 'env2',
      type: QuestionType.Part1,
      text: 'What do you do to help protect the environment?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 20,
    },
    {
      id: 'env3',
      type: QuestionType.Part2,
      text: 'Describe an environmental problem in your area. You should say:\n- What the problem is\n- How long it has existed\n- What causes it\n- And explain what could be done to solve it',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 120,
    },
    {
      id: 'env4',
      type: QuestionType.Part3,
      text: 'What are the main environmental challenges facing the world today?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 60,
    },
    {
      id: 'env5',
      type: QuestionType.Part3,
      text: 'Should governments or individuals take more responsibility for environmental protection?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 60,
    },
  ],
};
