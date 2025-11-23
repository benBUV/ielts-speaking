import { QuestionBank, QuestionType } from '@/types';

export const technologyQuestionBank: QuestionBank = {
  id: 'technology',
  name: 'Technology',
  description: 'Questions focused on technology, innovation, and digital life',
  author: 'IELTS Practice Team',
  version: '1.0',
  questions: [
    {
      id: 'tech1',
      type: QuestionType.Part1,
      text: 'How often do you use technology in your daily life?',
      // Example: Use video files from public folder: media: '/videos/computers1.mp4'
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 20,
    },
    {
      id: 'tech2',
      type: QuestionType.Part1,
      text: 'What is your favorite piece of technology?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 20,
    },
    {
      id: 'tech3',
      type: QuestionType.Part2,
      text: 'Describe a piece of technology you find useful. You should say:\n- What it is\n- When you got it\n- How you use it\n- And explain why you find it useful',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 120,
    },
    {
      id: 'tech4',
      type: QuestionType.Part3,
      text: 'How has technology changed the way people communicate?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 60,
    },
    {
      id: 'tech5',
      type: QuestionType.Part3,
      text: 'What are the potential dangers of relying too much on technology?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 60,
    },
  ],
};
