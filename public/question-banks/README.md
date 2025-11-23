# Welcome to Your Miaoda Project
Miaoda Application Link URL
    URL:https://medo.dev/projects/app-7mwz1usnv1fl

# Question Banks Directory

This directory contains JSON files for IELTS Speaking Practice question banks. Question banks are loaded dynamically based on the `?bank=` URL parameter.

## How to Add a New Question Bank

### Step 1: Create a JSON File

Create a new JSON file in this directory with your bank ID as the filename (e.g., `travel.json`).

### Step 2: Define the Question Bank Structure

Use the following structure:

```json
{
  "id": "travel",
  "name": "Travel & Tourism",
  "description": "Questions about travel experiences and tourism",
  "author": "Your Name",
  "version": "1.0",
  "questions": [
    {
      "id": "travel-q1",
      "type": "part1",
      "text": "Do you enjoy traveling?",
      "speakingDuration": 20
    },
    {
      "id": "travel-q2",
      "type": "part2",
      "text": "Describe a memorable trip you have taken.",
      "speakingDuration": 120,
      "card": {
        "title": "Describe a memorable trip you have taken.",
        "subtitle": "You should say:",
        "bullets": [
          "where you went",
          "when you went there",
          "what you did",
          "explain why it was memorable"
        ]
      }
    },
    {
      "id": "travel-q3",
      "type": "part3",
      "text": "How has tourism changed in recent years?",
      "speakingDuration": 60
    }
  ]
}
```

### Step 3: Update the Manifest (Optional)

Add your bank ID to `manifest.json`:

```json
{
  "banks": [
    "technology",
    "education",
    "environment",
    "travel"
  ]
}
```

**Note**: The manifest is optional. Banks can be loaded directly via URL parameter even if not listed in the manifest.

### Step 4: Access Your Question Bank

Use the URL parameter to load your bank:

```
https://your-app.com/?bank=travel
```

## Question Bank Structure

### Required Fields

- **id** (string): Unique identifier for the bank
- **name** (string): Display name of the bank
- **description** (string): Brief description of the bank
- **author** (string): Author or creator name
- **version** (string): Version number
- **questions** (array): Array of question objects

### Question Object Structure

#### Required Fields

- **id** (string): Unique identifier for the question
- **type** (string): Question type - `"part1"`, `"part2"`, or `"part3"`
- **text** (string): The question text
- **speakingDuration** (number): Speaking time in seconds
  - Part 1: 20 seconds
  - Part 2: 120 seconds (2 minutes)
  - Part 3: 60 seconds (1 minute)

#### Optional Fields

- **media** (string): URL to YouTube video or audio file
  - YouTube: `"https://www.youtube.com/watch?v=VIDEO_ID"`
  - Audio: `"https://example.com/audio.mp3"`
  - Video: `"https://example.com/video.mp4"`

- **card** (object): Cue card for Part 2 questions only
  - **title** (string): Card title (usually same as question text)
  - **subtitle** (string): Subtitle (usually "You should say:")
  - **bullets** (array): Array of bullet points (3-4 items)

### Example with All Features

```json
{
  "id": "example-q1",
  "type": "part2",
  "text": "Describe a book you recently read.",
  "media": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "speakingDuration": 120,
  "card": {
    "title": "Describe a book you recently read.",
    "subtitle": "You should say:",
    "bullets": [
      "what the book was about",
      "when you read it",
      "why you chose to read it",
      "explain whether you would recommend it to others"
    ]
  }
}
```

## Question Types

### Part 1 (20 seconds)
- Short, simple questions about familiar topics
- Personal information and experiences
- Quick responses expected

### Part 2 (120 seconds / 2 minutes)
- Long-turn monologue
- Requires cue card with bullet points
- Student speaks for 2 minutes on a topic

### Part 3 (60 seconds / 1 minute)
- Discussion questions
- More abstract and analytical
- Follow-up to Part 2 topic

## Best Practices

1. **Question IDs**: Use descriptive, unique IDs (e.g., `travel-q1`, `tech-part2-1`)
2. **Question Order**: Mix question types for variety
3. **Cue Cards**: Always include cue cards for Part 2 questions
4. **Media**: Use high-quality, relevant media content
5. **Duration**: Follow IELTS standard durations
6. **Validation**: Test your JSON file for syntax errors before deploying

## Testing Your Question Bank

1. Save your JSON file in this directory
2. Access the app with `?bank=your-bank-id`
3. Verify all questions load correctly
4. Test recording and playback functionality
5. Check that cue cards display properly for Part 2

## Troubleshooting

### Bank Not Loading
- Check JSON syntax (use a JSON validator)
- Verify file is in `/public/question-banks/` directory
- Check browser console for error messages
- Ensure bank ID in URL matches filename (without .json)

### Questions Not Displaying
- Verify `questions` array is not empty
- Check that all required fields are present
- Ensure question types are lowercase (`"part1"`, not `"Part1"`)

### Cue Card Not Showing
- Verify question type is `"part2"`
- Check that `card` object has all required fields
- Ensure `bullets` array has at least one item

## Examples

See the existing question banks for reference:
- `technology.json` - Technology and innovation topics
- `education.json` - Education and learning topics
- `environment.json` - Environmental issues and nature

## Support

For issues or questions, please refer to the main application documentation.
