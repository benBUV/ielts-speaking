import { useState } from 'react';
import { Play, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Recording, Question } from '@/types';
import { cn } from '@/lib/utils';

interface ReviewSectionProps {
  recordings: Recording[];
  questions: Question[];
  onDownloadIndividual: (recordingId: string) => void;
  onDownloadMerged: () => void;
}

export const ReviewSection = ({
  recordings,
  questions,
  onDownloadIndividual,
  onDownloadMerged,
}: ReviewSectionProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  console.log('ReviewSection rendering with recordings:', recordings.length);
  recordings.forEach((rec, idx) => {
    console.log(`Review Recording ${idx + 1}:`, {
      id: rec.id,
      transcript: rec.transcript,
      transcriptLength: rec.transcript?.length || 0,
      hasTranscript: !!rec.transcript,
    });
  });

  const handlePlayPause = (recording: Recording) => {
    if (playingId === recording.id) {
      const audio = audioElements.get(recording.id);
      audio?.pause();
      setPlayingId(null);
    } else {
      audioElements.forEach((audio, id) => {
        if (id !== recording.id) {
          audio.pause();
        }
      });

      let audio = audioElements.get(recording.id);
      if (!audio) {
        audio = new Audio(URL.createObjectURL(recording.audioBlob));
        audio.onended = () => setPlayingId(null);
        audioElements.set(recording.id, audio);
      }

      audio.play();
      setPlayingId(recording.id);
    }
  };

  const getQuestionForRecording = (recording: Recording) => {
    return questions.find((q) => q.id === recording.questionId);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Well done! Review your response(s) below
        </h2>
        <Button onClick={onDownloadMerged} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Download All
        </Button>
      </div>

      <div className="grid gap-4">
        {recordings.map((recording, index) => {
          const question = getQuestionForRecording(recording);
          const isPlaying = playingId === recording.id;

          return (
            <Card key={recording.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">
                    Question {index + 1} - {question?.type.toUpperCase()}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {formatDuration(recording.duration)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Question:</p>
                  <p className="text-foreground">{question?.text}</p>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handlePlayPause(recording)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => onDownloadIndividual(recording.id)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>

                {recording.transcript && (
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Transcript:</p>
                    <p className="text-foreground whitespace-pre-wrap">{recording.transcript}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
