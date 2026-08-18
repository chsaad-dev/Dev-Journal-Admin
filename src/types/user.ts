export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  bio: string;
  role: "admin" | "reader";
  followerCount: number;
  followingCount: number;
  suspended: boolean;
  createdAt: any;
}
