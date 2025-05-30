// controllers/taskControllers.js
import Task from "../models/Task.js";
import logger from "../utils/logger.js";
import "../cron/checkDueTasks.js";


export const getTasks = async (req, res) => {
    try {
        logger.info(`tasks "Fetching tasks for user ID: ${req.user.id}"`);
        const tasks = await Task.findAll({
            where: { userId: req.user.id },
        });

        if (tasks.length === 0) { 
            logger.warn(`No task has been created for this user: ${req.user.id}`);
            return res.status(404).json({ status: true, tasks: [], msg: "No tasks found." });
        }
        
        logger.info("All tasks found for user");
        res.status(200).json({ tasks, status: true, msg: "Tasks found successfully." });
    } catch (err) {
        logger.error("Error fetching tasks for this profile:", err);
        return res.status(500).json({ status: false, msg: "Internal Server Error" });
    }
};

export const getTask = async (req, res) => {
    try {
        logger.info(`Fetching task ${req.params.id} for user ID: ${req.user.id}`);

        const task = await Task.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

       if (!task) {
            logger.warn(`Task not found for user: ${req.user.id}`);
            return res.status(400).json({ status: false, msg: "No task found." });
        } 


        logger.info(`Task found for user: ${req.user.id}`);
        res.status(200).json({ task, status: true, msg: "Task found successfully." });
    } catch (err) {
        logger.error(`Error fetching tasks for this profile: ${err.message}`, { error: err });
        return res.status(500).json({ status: false, msg: "Internal Server Error" });
    }
};


export const patchTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ["pending", "completed", "inprogress", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, msg: "Invalid status value." });
  }

  try {
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found" });
    }

    if (task.userId !== req.user.id) {
      return res.status(403).json({ success: false, msg: "Unauthorized" });
    }

    task.status = status;
    await task.save();

    res.json({ success: true, msg: "Status updated", task });
  } catch (error) {
    console.error("Error updating task status:", error.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};


export const postTask = async (req, res) => {
  try {
    logger.info(`Creating task for user ID: ${req.user.id}`);

    const { description, dueDate } = req.body;
    const userId = req.user.id;

    if (!description) {
      logger.warn(`Description not found for user: ${userId}`);
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }

    // Normalize description to prevent duplicates like "Buy Milk" and "buy milk "
    const normalizedDescription = description.trim().toLowerCase();

    // Check if task already exists for this user
    const existingTask = await Task.findOne({
      where: {
        userId,
        description: normalizedDescription
      }
    });

    if (existingTask) {
      return res.status(400).json({ status: false, msg: "Task with this description already exists." });
    }

    // Create new task
    const task = await Task.create({
      userId,
      description: normalizedDescription,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    logger.info(`Task created for user: ${userId}`);
    res.status(201).json({ task, status: true, msg: "Task created successfully." });

  } catch (err) {
    logger.error("Error creating task:", err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};



export const putTask = async (req, res) => {
    try {
        logger.info(`Updating task for user ID: ${req.user.id}`);

        const { description, dueDate, status } = req.body;

        if (!description && !dueDate && !status) {
            logger.warn(`No update fields provided by user: ${req.user.id}`);
            return res.status(400).json({ status: false, msg: "Nothing to update." });
        }

        // Match ENUM values exactly
        const allowedStatuses = ["pending", "completed", "inProgress", "cancelled"];
        if (status && !allowedStatuses.includes(status)) {
            logger.warn(`Invalid status "${status}" provided by user: ${req.user.id}`);
            return res.status(400).json({ status: false, msg: "Invalid status value." });
        }

        const task = await Task.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!task) {
            logger.warn(`Task not found for user: ${req.user.id}`);
            return res.status(404).json({ status: false, msg: "Task with given ID not found" });
        }

        const updatedTask = await task.update({
            description: description ?? task.description,
            dueDate: dueDate ? new Date(dueDate) : task.dueDate,
            status: status ?? task.status,
        });

        logger.info(`Task updated successfully for user: ${req.user.id}`);
        return res.status(200).json({ task: updatedTask, status: true, msg: "Task updated successfully." });
    } catch (err) {
        logger.error("Error updating task for this profile", err);
        return res.status(500).json({ status: false, msg: "Internal Server Error" });
    }
};


export const deleteTask = async (req, res) => {
  try {
    logger.info(`Deleting task for user ID: ${req.user.id}`);
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) {
      logger.warn(`Task not found for user: ${req.user.id}`);
      return res.status(404).json({ status: false, msg: "Task with given ID not found" });
    }

     // Optional: Conditionally allow deletion
    if (task.status !== "completed"  || "cancelled" && !isPastDue(task.dueDate)) {
     return res.status(400).json({ msg: "Task is neither completed nor past due; not deleted." });
   }
    await task.destroy();
    logger.info(`Task deleted for user: ${req.user.id}`);
    return res.status(200).json({ status: true, msg: "Task deleted successfully." });
  } catch (err) {
    logger.error("Error deleting task", err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};
