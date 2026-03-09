import { prisma } from "@social-app/db";
import { redis } from "../lib/redis.js";

const ONLINE_SET = "users:online";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

interface MatchResult {
  userId: string;
  isExpert: boolean;
  score: number;
}

export async function findRespondersForQuestion(
  questionId: string,
  topicIds: string[],
  subTopicIds: string[],
  authorId: string,
  limit = 3
): Promise<MatchResult[]> {
  const experts = await prisma.userExpertise.findMany({
    where: {
      topicId: { in: topicIds },
      ...(subTopicIds.length > 0 ? { subTopicId: { in: subTopicIds } } : {}),
      points: { gt: 0 },
      userId: { not: authorId },
    },
    orderBy: { points: "desc" },
    take: limit * 2,
    select: { userId: true, points: true },
  });

  const uniqueExperts = Array.from(
    new Map(experts.map((e) => [e.userId, e])).values()
  );

  const onlineExperts: MatchResult[] = [];
  for (const expert of uniqueExperts) {
    const isOnline = await redis.sismember(ONLINE_SET, expert.userId);
    if (isOnline) {
      onlineExperts.push({
        userId: expert.userId,
        isExpert: true,
        score: expert.points,
      });
    }
  }

  if (onlineExperts.length >= limit) {
    return onlineExperts.slice(0, limit);
  }

  const offlineExperts = uniqueExperts
    .filter((e) => !onlineExperts.find((o) => o.userId === e.userId))
    .slice(0, limit - onlineExperts.length)
    .map((e) => ({ userId: e.userId, isExpert: true, score: e.points }));

  const allExperts = [...onlineExperts, ...offlineExperts];

  if (allExperts.length >= limit) {
    return allExperts.slice(0, limit);
  }

  const excludeIds = [authorId, ...allExperts.map((e) => e.userId)];

  const interestedUsers = await prisma.userInterest.findMany({
    where: {
      topicId: { in: topicIds },
      userId: { notIn: excludeIds },
      user: {
        lastActiveAt: { gte: new Date(Date.now() - FIVE_MINUTES_MS) },
      },
    },
    select: { userId: true, score: true },
    orderBy: { score: "desc" },
    take: (limit - allExperts.length) * 2,
  });

  const uniqueInterested = Array.from(
    new Map(interestedUsers.map((u) => [u.userId, u])).values()
  );

  const nearby = uniqueInterested
    .slice(0, limit - allExperts.length)
    .map((u) => ({ userId: u.userId, isExpert: false, score: u.score }));

  const allMatches = [...allExperts, ...nearby];

  if (allMatches.length >= limit) {
    return allMatches.slice(0, limit);
  }

  const stillExclude = [authorId, ...allMatches.map((m) => m.userId)];
  const remaining = limit - allMatches.length;

  const recentUsers = await prisma.user.findMany({
    where: {
      id: { notIn: stillExclude },
      lastActiveAt: { gte: new Date(Date.now() - FIVE_MINUTES_MS) },
    },
    select: { id: true },
    take: remaining * 3,
  });

  const shuffled = recentUsers.sort(() => Math.random() - 0.5);
  const randomPicks = shuffled.slice(0, remaining).map((u) => ({
    userId: u.id,
    isExpert: false,
    score: 0,
  }));

  return [...allMatches, ...randomPicks];
}

export async function awardExpertisePoints(
  userId: string,
  topicIds: string[],
  subTopicIds: string[],
  points: number,
  accepted: boolean
) {
  for (const topicId of topicIds) {
    await prisma.userExpertise.upsert({
      where: {
        userId_topicId_subTopicId: { userId, topicId, subTopicId: null },
      },
      update: {
        points: { increment: points },
        totalAnswers: { increment: 1 },
        ...(accepted ? { correctAnswers: { increment: 1 } } : {}),
      },
      create: {
        userId,
        topicId,
        points,
        totalAnswers: 1,
        correctAnswers: accepted ? 1 : 0,
      },
    });
  }

  for (const subTopicId of subTopicIds) {
    const subTopic = await prisma.subTopic.findUnique({
      where: { id: subTopicId },
      select: { topicId: true },
    });
    if (!subTopic) continue;

    await prisma.userExpertise.upsert({
      where: {
        userId_topicId_subTopicId: { userId, topicId: subTopic.topicId, subTopicId },
      },
      update: {
        points: { increment: points },
        totalAnswers: { increment: 1 },
        ...(accepted ? { correctAnswers: { increment: 1 } } : {}),
      },
      create: {
        userId,
        topicId: subTopic.topicId,
        subTopicId,
        points,
        totalAnswers: 1,
        correctAnswers: accepted ? 1 : 0,
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { helpfulnessScore: { increment: points } },
  });
}

export async function autoTrackInterest(
  userId: string,
  topicIds: string[],
  subTopicIds: string[]
) {
  for (const topicId of topicIds) {
    const existing = await prisma.userInterest.findUnique({
      where: { userId_topicId_subTopicId: { userId, topicId, subTopicId: null } },
    });
    if (existing) {
      await prisma.userInterest.update({
        where: { id: existing.id },
        data: { score: { increment: 0.1 } },
      });
    } else {
      await prisma.userInterest.create({
        data: { userId, topicId, score: 0.5 },
      });
    }
  }

  for (const subTopicId of subTopicIds) {
    const sub = await prisma.subTopic.findUnique({
      where: { id: subTopicId },
      select: { topicId: true },
    });
    if (!sub) continue;

    const existing = await prisma.userInterest.findUnique({
      where: { userId_topicId_subTopicId: { userId, topicId: sub.topicId, subTopicId } },
    });
    if (existing) {
      await prisma.userInterest.update({
        where: { id: existing.id },
        data: { score: { increment: 0.1 } },
      });
    } else {
      await prisma.userInterest.create({
        data: { userId, topicId: sub.topicId, subTopicId, score: 0.5 },
      });
    }
  }
}
