export interface Ichat {
  created_at: string;
  editable: boolean;
  id: string;
  sender: string;
  text: string;
  users: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}
