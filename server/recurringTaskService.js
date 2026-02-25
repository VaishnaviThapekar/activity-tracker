const db = require('./database');

/**
 * Generate recurring tasks for upcoming dates
 * Checks all active recurring tasks and creates instances if needed
 */
function generateRecurringTasks() {
    console.log('Generating recurring tasks...');
    
    // Get all active recurring parent tasks
    db.all(
        `SELECT DISTINCT t1.* FROM tasks t1
         WHERE t1.is_recurring = 1 AND t1.is_active = 1 AND t1.parent_task_id IS NULL`,
        [],
        (err, recurringTasks) => {
            if (err) {
                console.error('Error fetching recurring tasks:', err);
                return;
            }

            recurringTasks.forEach(task => {
                const pattern = task.recurrence_pattern; // 'daily', 'weekdays', 'weekly', 'custom'
                generateTaskInstances(task, pattern);
            });
        }
    );
}

/**
 * Create task instances for the next 7 days based on recurrence pattern
 */
function generateTaskInstances(parentTask, pattern) {
    const today = new Date();
    const daysToGenerate = 7; // Generate for next week

    for (let i = 0; i < daysToGenerate; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0];

        // Check if should create task for this date based on pattern
        if (!shouldCreateForDate(targetDate, pattern)) {
            continue;
        }

        // Check if instance already exists for this date
        db.get(
            `SELECT id FROM tasks WHERE parent_task_id = ? AND task_date = ?`,
            [parentTask.id, dateStr],
            (err, existing) => {
                if (err) {
                    console.error('Error checking existing task:', err);
                    return;
                }

                if (!existing) {
                    // Create new instance
                    db.run(
                        `INSERT INTO tasks 
                         (user_id, title, description, scheduled_time, task_date, 
                          parent_task_id, is_recurring, recurrence_pattern, is_active)
                         VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 1)`,
                        [
                            parentTask.user_id,
                            parentTask.title,
                            parentTask.description,
                            parentTask.scheduled_time,
                            dateStr,
                            parentTask.id
                        ],
                        function(err) {
                            if (err) {
                                console.error('Error creating recurring task instance:', err);
                            } else {
                                console.log(`Created recurring task instance: ${parentTask.title} for ${dateStr}`);
                            }
                        }
                    );
                }
            }
        );
    }
}

/**
 * Determine if a task should be created for a specific date based on pattern
 */
function shouldCreateForDate(date, pattern) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    switch (pattern) {
        case 'daily':
            return true;
        case 'weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday
        case 'weekends':
            return dayOfWeek === 0 || dayOfWeek === 6; // Saturday-Sunday
        case 'weekly':
            // Create on the same day of week as parent task
            return true; // For simplicity, create daily - can be enhanced
        default:
            return true;
    }
}

/**
 * Toggle recurring task active status
 */
function toggleRecurringTask(taskId, isActive) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE tasks SET is_active = ? WHERE id = ?`,
            [isActive ? 1 : 0, taskId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Also update all child instances
                    db.run(
                        `UPDATE tasks SET is_active = ? WHERE parent_task_id = ? AND status = 'pending' AND task_date >= date('now')`,
                        [isActive ? 1 : 0, taskId],
                        (err) => {
                            if (err) reject(err);
                            else resolve({ changes: this.changes });
                        }
                    );
                }
            }
        );
    });
}

module.exports = {
    generateRecurringTasks,
    toggleRecurringTask
};
