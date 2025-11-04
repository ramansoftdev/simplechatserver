export interface Message {
    id: number;
    username: string;
    message: string;
    created_at: string;
  }
  
  export interface UserJoinedData {
    username: string;
    onlineUsers: string[];
  }
  
  export interface UserLeftData {
    username: string;
    onlineUsers: string[];
  }