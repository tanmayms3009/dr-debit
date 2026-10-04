# Dr. Debit

Visual financial accounting lessons: slides, notes, common mistakes and three-level quizzes.

## Files

- `index.html`: start page (opens the first lesson until a home page is built)
- `lessons.js`: the list of published lessons, in order. Add one line here for each new lesson.
- `site.css`: shared design for every page
- `site.js`: shared behaviour (sidebar, slides, quiz, progress, video)
- `<lesson>.html`: one file per lesson
- `voiceovers/`: recording scripts, one folder per main topic, numbered in lesson order (blocked on the live site)
- `_redirects`, `404.html`: hide internal files and show a friendly page for missing links

## Adding a video to a lesson

Open the lesson file, find `youtubeId: ''` near the bottom and paste the YouTube video ID between the quotes. The video section appears only when an ID is set.
