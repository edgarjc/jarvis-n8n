# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jarvis is a personal AI assistant automation system built entirely on **n8n** (open-source workflow automation platform). It consists of four workflow JSON files that work together to provide intelligent task management via Telegram.

**This is NOT a traditional code project** - it contains n8n workflow configurations (JSON files) that run in an n8n instance, not source code that needs compilation.

## Workflow Architecture

```
User (Telegram) → Jarvis.json → Notion Database ← Jarvis_DailyDigest.json (8am Morning Briefing)
                       ↓                         ← Jarvis_SmartNotifications.json (every 30min)
              Jarvis_Conversations DB
```

### Three Workflows

1. **Jarvis.json** (Main Assistant) - Processes user input via Telegram
   - Intent detection: QUERY | COMMAND | CAPTURE
   - Voice transcription via OpenAI Whisper
   - Natural language command parsing
   - CRUD operations on Notion database
   - **Memory System**: Stores/retrieves conversation history for context awareness
   - **Quick Templates**: Structured capture for work and life (/standup, /gratitude, etc.)

2. **Jarvis_DailyDigest.json** (Morning Briefing) - Daily 8am comprehensive briefing
   - **Weather** via Open-Meteo API
   - **AI Focus Items** - Top 3 prioritized tasks with reasoning
   - Yesterday's recap
   - Strategic advice (context: Sidecar.bz creator analytics platform)
   - Market insights and suggested actions

3. **Jarvis_SmartNotifications.json** - Smart reminders every 30 minutes
   - Upcoming reminders (60-min window)
   - Deadline notifications (today/tomorrow/week)
   - Weekly review on Sundays at 7pm
   - **Pattern Recognition** (morning check): Detects overcommit, priority inflation, low productivity days, completion streaks, stale tasks

## Integrated Services

| Service | Purpose |
|---------|---------|
| Telegram | User interface (bot commands, voice, text) |
| Notion | Data persistence (main database + conversations database) |
| OpenAI | GPT-4o for intent detection, command parsing, strategic advice, task prioritization |
| Open-Meteo | Weather API (free, no key required) |

## Notion Database Schema

### Main Jarvis Database
Database ID: `2d72ec63-f882-809a-85c5-d2f4927b3856`

Properties used across workflows:
- **Name** (title), **Summary** (rich text)
- **Note Type** (select): reminder, task, idea, meeting-notes, journal, reference, question
- **Priority** (select): high, medium, low
- **Status** (select): pending, completed, archived
- **Tags**, **Actions**, **People/Companies** (multi-select)
- **When**, **Reminder Date**, **Deadline** (date)
- **Source** (select): voice, text

### Jarvis_Conversations Database (Memory System)
**REQUIRED SETUP**: Create this database in Notion and replace `JARVIS_CONVERSATIONS_DB_ID` in Jarvis.json with the actual database ID.

Properties:
- **Message ID** (title) - Auto-generated unique identifier
- **Chat ID** (number) - Telegram chat ID for user isolation
- **User Message** (rich_text) - Original user input
- **Intent** (select): query, command, capture
- **Subtype** (select): list_today, complete, reminder, etc.
- **Referenced IDs** (rich_text) - Comma-separated Notion page IDs
- **Referenced Titles** (rich_text) - Comma-separated item titles
- **Response Summary** (rich_text) - What Jarvis did
- **Timestamp** (date) - When the conversation happened
- **Session ID** (rich_text) - Groups related messages (30-min window)

## Development & Deployment

### No Build System Required
n8n workflows are JSON configurations - no compilation, bundling, or package management needed.

### Deploying Workflows
1. Import all 4 JSON files into n8n UI (Create New Workflow → Import)
2. Configure credentials for Telegram, OpenAI, and Notion
3. Enable webhook endpoints for Telegram triggers
4. **Replace placeholder values**:
   - `JARVIS_CONVERSATIONS_DB_ID` in Jarvis.json → your Conversations database ID
   - `YOUR_TELEGRAM_CHAT_ID` in Jarvis_TaskPrioritization.json → your Telegram chat ID
5. Activate all workflows

### Testing
- Send messages to the Telegram bot
- Use n8n's built-in execution history for debugging
- Test individual nodes using n8n's node test feature

### Modifying Workflows
- Edit directly in n8n visual editor (recommended)
- Export to JSON for version control
- JSON structure: `nodes[]` array with node configurations and `connections` object defining data flow

## Key Implementation Patterns

### Intent Classification System
User messages are classified into:
- **QUERY**: Asking for information (list_today, list_all, search, stats, etc.)
- **COMMAND**: Action on existing items (complete, archive, snooze, priority, edit, undo)
- **CAPTURE**: Save new note/task/reminder/idea

### Supported Commands
| Command | Description | Examples |
|---------|-------------|----------|
| complete | Mark items as done | "done", "finished", "I did both" |
| archive | Archive items | "archive that", "put it away" |
| snooze | Reschedule reminders | "push to tomorrow", "snooze until Monday" |
| priority | Change priority level | "make it urgent", "low priority" |
| edit | Modify item properties | "rename to X", "change deadline to Friday", "add tag work" |
| undo | Restore completed/archived items | "undo", "bring back", "restore" |

### Quick Actions (Slash Commands)
| Command | Description |
|---------|-------------|
| /today | Show today's tasks and reminders |
| /week | Show everything due this week |
| /overdue | Show overdue tasks |
| /high | Show high priority items |

### Work Templates
Structured capture for productivity and entrepreneurship:

| Template | Purpose | Fields |
|----------|---------|--------|
| /standup | Daily accountability | Yesterday, Today, Blockers |
| /idea | Structured idea capture | Problem, Solution, Target User, Why Now |
| /metrics | Track key numbers | Revenue, Users, Conversion, Custom |
| /customer | Customer feedback log | Who, Feedback, Sentiment, Action |
| /decision | Decision journal | Decision, Options, Reasoning, Reversible |
| /win | Celebrate progress | What, Impact, Who helped |
| /learn | Capture lessons | What happened, Lesson, Apply to |
| /competitor | Competitive intel | Who, What, Threat level, Response |
| /reflect | Weekly reflection | Energy, Win, Challenge, Next week |
| /braindump | Quick brain dump | Free-form capture |

### Life Templates
Track wellness and personal growth:

| Template | Purpose | Fields |
|----------|---------|--------|
| /gratitude | Daily gratitude | 3 things you're grateful for |
| /mood | Mood check-in | Mood, Energy, Why, Need |
| /workout | Exercise log | Type, Duration, Intensity, Notes |
| /meal | Food tracking | Meal, Food, How I feel |
| /sleep | Sleep quality | Hours, Quality, Notes |
| /goal | Goal progress | Goal, Progress, Next Step, Blockers |
| /expense | Expense tracking | Amount, Category, What, Necessary |

Templates prompt you with a structured format, then save your response with the appropriate Note Type.

### Context/Memory System
The workflow stores conversation history in `Jarvis_Conversations` database:
- Fetches last 10 conversations before processing new messages
- Enables reference resolution ("that task", "the first one", "both")
- Groups messages into sessions (30-minute window)
- Tracks which items were discussed for better context

### Proactive Intelligence

**Morning Briefing** (Jarvis_DailyDigest.json):
- Single comprehensive 8am message combining:
  - Weather forecast
  - AI-prioritized top 3 focus items (considers deadlines, priority, day-of-week patterns)
  - Yesterday's activity recap
  - Strategic advice and market insights
  - Suggested actions for the day
- Warns about overload or overdue items

**Pattern Recognition** (in Jarvis_SmartNotifications.json):
- Runs during morning check (8-10am)
- Detects 5 pattern types:
  1. **Overcommit**: >8 pending tasks
  2. **Priority Inflation**: >3 high priority items
  3. **Day-of-week patterns**: Low productivity days detected
  4. **Completion Streaks**: Tracks momentum
  5. **Stale Tasks**: Items pending 2+ weeks

### Weather Integration
Daily digest includes weather data from Open-Meteo API (no API key required):
- Current conditions with emoji icons
- High/low temperatures
- Rain probability alerts (warns if >60%)
- Coordinates: 40.7128, -74.0060 (NYC - modify in Jarvis_DailyDigest.json)

### Timezone Handling
All date/time operations use **America/New_York (EST)** timezone consistently.

### Node Types Used
- Triggers: `telegramTrigger`, `scheduleTrigger`
- Integrations: `telegram`, `notion`, `@n8n/n8n-nodes-langchain.openAi`, `httpRequest`
- Logic: `code` (JavaScript), `if`, `switch`, `merge`, `set`

## Future Enhancements (Planned)

### Google Calendar Integration
Requires OAuth setup. Features planned:
- Today's meetings in Daily Digest
- Conflict detection (deadlines during meetings)
- Focus time blocking via command
