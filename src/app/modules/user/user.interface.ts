export type TUserPayload = {
  password: string;
  user: {
    email: string;
    name: string;
    avatarUrl?: string;
  };
};
