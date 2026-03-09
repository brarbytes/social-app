import { router } from "./index.js";
import { authRouter } from "./routers/auth.js";
import { postRouter } from "./routers/post.js";
import { chatRouter } from "./routers/chat.js";
import { questionRouter } from "./routers/question.js";
import { connectionRouter } from "./routers/connection.js";
import { notificationRouter } from "./routers/notification.js";
import { groupRouter } from "./routers/group.js";
import { friendRouter } from "./routers/friend.js";
import { interestRouter } from "./routers/interest.js";

export const appRouter = router({
  auth: authRouter,
  post: postRouter,
  chat: chatRouter,
  question: questionRouter,
  connection: connectionRouter,
  notification: notificationRouter,
  group: groupRouter,
  friend: friendRouter,
  interest: interestRouter,
});

export type AppRouter = typeof appRouter;
