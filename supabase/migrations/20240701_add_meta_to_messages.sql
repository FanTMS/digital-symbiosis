-- Добавление поля meta для хранения метаданных сообщений (например, тип, payload для системных сообщений)
ALTER TABLE messages ADD COLUMN meta jsonb DEFAULT NULL; 