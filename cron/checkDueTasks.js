// cron/checkDueTasks.js
import cron from "node-cron";
import Task from "../models/Task.js";
import { Op } from "sequelize";
import { sendDueTaskEmail } from "../utils/sendEmail.js"; // ✅ Import your mailer
import User from "../models/User.js"; // Needed to get user email


// helpers/date.js
export const isPastDue = (dueDate) =>
  dueDate && new Date(dueDate) < Date.now();


cron.schedule("0 * * * *", async () => {
  console.log("⏰ Checking for due tasks...");
  

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    const dueTasks = await Task.findAll({
      where: {
        dueDate: {
          [Op.between]: [oneHourAgo, now],
        },
        status: { [Op.ne]: "completed" }, // Not completed
      },
      include: [{ model: User, attributes: ["email"] }], // 🔍 include user info
    });

    if (dueTasks.length === 0) {
      console.log("✅ No due tasks in this interval.");
      return;
    }

    for (const task of dueTasks) {
      const userEmail = task.User?.email;
      if (!userEmail) {
        console.log(`⚠️ No email found for user of task "${task.description}"`);
        continue;
      }

      // Send email
       await sendDueTaskEmail(
        userEmail,
        task.description,
        task.dueDate
       );
      console.log(`📧 Email sent for task: "${task.description}"`);

      // Delete task
      await task.destroy();
      console.log(`🗑️ Deleted task: "${task.description}"`);
    }
  } catch (err) {
    console.error("❌ Error checking due tasks:", err.message);
  }
});
