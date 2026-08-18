export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: any;
  postId?: string;
  postTitle?: string;
  userName?: string;
  userPhotoUrl?: string;
}
