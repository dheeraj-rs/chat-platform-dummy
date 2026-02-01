/*
  # Create D-admin Chat Platform Schema

  ## Overview
  This migration sets up the database schema for the D-admin AI chat platform,
  similar to Bolt.new, Claude.ai, ChatGPT, and DeepSeek Chat.

  ## New Tables
  
  ### `chats`
  - `id` (uuid, primary key) - Unique identifier for each chat conversation
  - `title` (text) - Title of the chat conversation
  - `created_at` (timestamptz) - When the chat was created
  - `updated_at` (timestamptz) - Last time the chat was updated
  - `user_id` (uuid) - Reference to the user who owns this chat (for future auth)

  ### `messages`
  - `id` (uuid, primary key) - Unique identifier for each message
  - `chat_id` (uuid, foreign key) - Reference to the parent chat
  - `role` (text) - Role of the message sender ('user' or 'assistant')
  - `content` (text) - The actual message content
  - `created_at` (timestamptz) - When the message was created

  ## Security
  - Enable RLS on both tables
  - For now, create permissive policies to allow all operations (will be restricted when auth is added)
  
  ## Indexes
  - Index on `chat_id` in messages table for efficient querying
  - Index on `created_at` for sorting
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);

-- Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development (allowing all operations)
-- These should be restricted when authentication is added

CREATE POLICY "Allow all operations on chats"
  ON chats
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on messages"
  ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
