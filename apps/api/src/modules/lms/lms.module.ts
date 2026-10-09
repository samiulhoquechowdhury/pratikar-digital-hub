import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { KnowledgeBaseModule } from "../ai/knowledge-base/knowledge-base.module";
import { AuditModule } from "../audit/audit.module";
import { NotificationsModule } from "../notifications/notifications.module";

import {
  COURSE_REMINDERS_QUEUE,
  CourseRemindersProcessor,
} from "./course-reminders.processor";
import { LmsController, QuizAdminController } from "./lms.controller";
import { LmsService } from "./lms.service";
import { QuizService } from "./quiz.service";

@Module({
  imports: [
    AuditModule,
    KnowledgeBaseModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: COURSE_REMINDERS_QUEUE,
      defaultJobOptions: {
        // A failed day is retried a few times; the claim on each enrolment
        // means a retry can't double-send what the first attempt did send.
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: { count: 60 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    }),
  ],
  controllers: [LmsController, QuizAdminController],
  providers: [LmsService, QuizService, CourseRemindersProcessor],
  exports: [LmsService],
})
export class LmsModule {}
