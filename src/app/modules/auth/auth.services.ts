import prisma from "../../../shared/prisma";
import * as bcrypt from "bcrypt";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../../config";
import { TUserPayload } from "../user/user.interface";
import { del, getOrSet } from "../../../helpers/redisCache";

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await getOrSet(`user:${payload.email}`, async () =>
    prisma.user.findUniqueOrThrow({
      where: {
        email: payload.email,
      },
    })
  );

  // comparing password
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  // throwing error for wrong password
  if (!isCorrectPassword) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Password doesn't match!");
  }

  // generating access token and refresh token
  const accessToken = jwtHelpers.generateToken(
    {
      ...userData,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      ...userData,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const userRegistration = async (payload: TUserPayload) => {
  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.salt_rounds)
  );

  const result = await prisma.user.create({
    data: {
      password: hashedPassword,
      email: payload.user.email,
      name: payload.user.name,
      avatarUrl: payload.user.avatarUrl,
    },
  });

  // generating access token and refresh token
  const accessToken = jwtHelpers.generateToken(
    {
      ...result,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      ...result,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );
  } catch (err) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id: decodedData.id,
    },
  });

  // generating new access token
  const accessToken = jwtHelpers.generateToken(
    {
      ...userData,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
  };
};

const changePassword = async (
  user: JwtPayload,
  payload: { oldPassword: string; newPassword: string }
) => {
  // checking if the user exists in the db
  // console.log(user?.email);
  const userData = await getOrSet(`user:${user.email}`, async () =>
    prisma.user.findUniqueOrThrow({
      where: {
        email: user.id,
      },
    })
  );

  // comparing password
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Password doesn't match!");
  }

  // hashing the new password
  const hashedPassword: string = await bcrypt.hash(
    payload.newPassword,
    Number(config.salt_rounds)
  );

  // updating the new password
  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  await del(`user:${user.email}`);

  return {
    message: "Password updated successfully!",
  };
};

export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
  userRegistration,
};
