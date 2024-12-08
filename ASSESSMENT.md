# Full-Stack Engineer Assessment: Real-time Chat Application

## Overview

You are provided with a basic real-time chat application built with Next.js, Socket.io, Tailwind CSS, and shadcn/ui. Your task is to implement additional features and improvements to enhance the application.

## Current Features

- Create new chat rooms
- Join existing rooms with room ID
- Leave chat rooms

## Features to Implement

### 1. User Typing Indicator

- Implement a "[user] is typing" indicator
- Show when someone in the room is currently typing
- Should disappear after user stops typing

### 2. User Leave & Entry Notification

- Add a notification when a user joins the room
- Add an inline message in the chat when a user leaves
- Message should show "{username} left/join the room"
- Style it differently from regular chat messages

### 3. End-to-End Testing

- Implement end-to-end tests using Playwright

### 4. Multiple Room Support

- Allow users to join multiple rooms simultaneously
- Implement a room switcher interface
- Maintain separate message history for each room
- Show unread message count for inactive rooms

### 5. User Management

- Implement room owner functionality
- Allow room owner to remove users
- Add user list display in each room (can be a modal or drawer)
- Implement room ownership transfer when owner leaves

### 6. Room Lifecycle Management

- Implement room deletion when empty
- Transfer ownership to next user that joined when owner leaves
- If no users are in the room, delete the room
- Add confirmation dialogs for critical actions

### Have Fun and Build Something Cool! (Bonus)

- We'd like to see your creativity, attention to detail and love for building cool stuff
- Feel free to add any additional features or experiences you think would be cool
- Examples:
  - Animations
  - Emojis
  - Random avatar for users with different colors
  - Optimistic updates for UI
  - Dark mode support

## Technical Requirements

- Use Prisma with MongoDB for data persistence (or just JSON)
- Implement proper error handling & validations
- Follow TypeScript best practices
- Write clean, maintainable code

## Evaluation Criteria

- Code quality and organization
- Feature completeness
- Test coverage
- Performance considerations
- Error handling
- UI/UX design
- Documentation quality

## How to Run Application

- `bun install` to install dependencies
- `bun dev` to run the application

## Submission

- Implement the required features
- Submit a pull request
- Include setup instructions
- Document any assumptions or design decisions

### Happy Hacking!
