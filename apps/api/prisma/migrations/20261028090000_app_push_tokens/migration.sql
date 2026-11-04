-- Phones running the Android app, for push notifications through Expo.
CREATE TABLE "AppPushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppPushToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppPushToken_token_key" ON "AppPushToken"("token");

CREATE INDEX "AppPushToken_userId_idx" ON "AppPushToken"("userId");

ALTER TABLE "AppPushToken" ADD CONSTRAINT "AppPushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
