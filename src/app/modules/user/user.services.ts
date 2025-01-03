import { del, getOrSet } from "../../../helpers/redisCache";
import prisma from "../../../shared/prisma";
import { JwtPayload } from "jsonwebtoken";

const getUserProfileFromDB = async (user: JwtPayload) => {
  const result = await getOrSet(`user:${user.email}`, async () =>
    prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
    })
  );

  return result;
};

const updateUserProfile = async (
  user: JwtPayload,
  payload: Record<string, any>
) => {
  const result = await prisma.user.update({
    where: {
      id: user?.id,
    },
    data: payload,
  });

  await del(`user:${user.email}`);

  return result;
};

export const UserServices = {
  getUserProfileFromDB,
  updateUserProfile,
};
