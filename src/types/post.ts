export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl: string;
  coverImagePublicId: string;
  authorId: string;
  tags: string[];
  createdAt: any; // Firebase Timestamp or Date
  updatedAt: any;
  published: boolean;
  readTimeMinutes: number;
  likeCount: number;
  commentCount: number;
  viewCount?: number;
}

export interface PostViewer {
  uid: string;
  name: string;
  photoUrl?: string;
  email?: string;
  viewedAt: any;
}
