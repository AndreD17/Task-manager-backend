import nodemailer from "nodemailer";

// Build ONE transporter at module load:
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port:process.env.EMAIL_PORT,
  secure: false,                                     // true ⇒ 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("EMAIL connection failed:", error);
  } else {
    console.log("✅ EMAIL server is ready to send emails");
  }
});


/**
 * Sends “task due” alert.
 * @param {string} to            Recipient e‑mail address
 * @param {string} taskDesc      Task description
 * @param {Date|string} dueDate  Due date (Date obj or ISO string)
 */
export const sendDueTaskEmail = async (to, taskDesc, dueDate) => {
  // Safely parse and format the due date
  const parsedDate = new Date(dueDate);
  const isValidDate = !isNaN(parsedDate);

  const formattedDate = isValidDate
    ? parsedDate.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    : "Not Set";

    if (!to || !/\S+@\S+\.\S+/.test(to)) {
      console.warn("❌ Invalid email address:", to);
      return;
    }

  const mailOptions = {
    from:  `"Task Manager" <${process.env.EMAIL_USER}>`,
    to,
    subject: "⚠️ Your Task is Due!",
    //text: `Task Due Alert\nTask: ${taskDesc}\nDue Date: ${formattedDate}\nPlease complete it soon or it will be deleted in an hour.`,
    html: `
      <h2>🚨 Task Due Alert</h2>
      <p><strong>Task:</strong> ${taskDesc}</p>
      <p><strong>Due Date:</strong> ${formattedDate}</p>
      <p>Please complete it soon or it will be deleted in an hour.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Sent due task email to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
};
