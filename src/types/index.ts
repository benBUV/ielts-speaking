export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export enum QuestionType {
  Part1 = 'part1',
  Part2 = 'part2',
  Part3 = 'part3',
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string; // Text prompt displayed as cue/hint to accompany the media
  media: string; // REQUIRED: URL for audio/video content - all questions must have media
  speakingDuration: number;
  card?: {
    title: string;
    subtitle?: string;
    bullets: string[];
  };
}

export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  author?: string;
  version?: string;
  questions: Question[];
}

export interface Recording {
  id: string;
  questionId: string;
  audioBlob: Blob;
  transcript: string;
  duration: number;
  timestamp: number;
}

export enum AppPhase {
  Loading = 'loading',
  Ready = 'ready',
  Preparation = 'preparation',
  Recording = 'recording',
  Review = 'review',
}

export interface AppState {
  phase: AppPhase;
  currentQuestionIndex: number;
  recordings: Recording[];
  isAudioPlaying: boolean;
}

