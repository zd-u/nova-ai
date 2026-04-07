export type ChatMessage = {
  id: string;
  content: string;
  sender: 'user' | 'nova';
  timestamp: number;
  loading?: boolean;
};

export type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
};
