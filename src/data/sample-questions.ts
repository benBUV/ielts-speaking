import { Question, QuestionType } from '@/types';

export const sampleQuestions: Question[] = [
  {
    id: 'q1',
    type: QuestionType.Part1,
    text: 'Do you work or are you a student?',
    media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    speakingDuration: 20,
  },
  {
    id: 'q2',
    type: QuestionType.Part1,
    text: 'What do you like most about your job or studies?',
    media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    speakingDuration: 20,
  },
  {
    id: 'q3',
    type: QuestionType.Part2,
    text: 'Describe a place you have visited that you particularly enjoyed. You should say:\n- Where it was\n- When you went there\n- What you did there\n- And explain why you enjoyed it',
    media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    speakingDuration: 120,
  },
  {
    id: 'q4',
    type: QuestionType.Part3,
    text: 'How has tourism changed in your country over the past few decades?',
    media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    speakingDuration: 60,
  },
  {
    id: 'q5',
    type: QuestionType.Part3,
    text: 'What are the advantages and disadvantages of international tourism?',
    media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    speakingDuration: 60,
  },
];
