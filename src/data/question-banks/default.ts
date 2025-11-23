import { QuestionBank, QuestionType } from '@/types';

export const defaultQuestionBank: QuestionBank = {
  id: 'default',
  name: 'General Topics',
  description: 'A mix of general IELTS speaking topics including work, travel, and tourism',
  author: 'IELTS Practice Team',
  version: '1.0',
  questions: [
    {
      id: 'q1',
      type: QuestionType.Part2,
      text: 'Describe a person you know who is very kind.',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 120,
      card: {
        title: 'Describe a person you know who is very kind.',
        subtitle: 'You should say:',
        bullets: [
          'who this person is',
          'how you know this person',
          'what he or she does',
          'explain why you think he or she is so kind'
        ]
      }
    },
    {
      id: 'q2',
      type: QuestionType.Part1,
      text: 'What do you like most about your job or studies?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 20,
    },
    {
      id: 'q3',
      type: QuestionType.Part2,
      text: 'Describe a place you have visited that you particularly enjoyed.',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 120,
      card: {
        title: 'Describe a place you have visited that you particularly enjoyed.',
        subtitle: 'You should say:',
        bullets: [
          'where it was',
          'when you went there',
          'what you did there',
          'explain why you enjoyed it'
        ]
      }
    },
    {
      id: 'q4',
      type: QuestionType.Part3,
      text: 'How has tourism changed in your country over the past few decades?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 60,
    },
    {
      id: 'q5',
      type: QuestionType.Part3,
      text: 'What are the advantages and disadvantages of international tourism?',
      media: 'https://www.youtube.com/watch?v=NpEaa2P7qZI', // YouTube video example
      speakingDuration: 60,
    },
  ],
};
