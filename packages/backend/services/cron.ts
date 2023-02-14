import Queue from "bull";
import config from "../config";
import { executeWorkflow } from "./workflow";

class CronService {
  private queue: Queue.Queue;
  constructor() {
    this.queue = new Queue(
      "Cron workflow queue",
      "redis://" + config.REDIS_URL
    );
    this.queue.process(async (data: any, done) => {
      console.log("Queue processing", data.data);
      const workflowId = data.data.id;
      if (!workflowId) {
        console.log("Cron without a workflow exists, returning early", data);
        done();
        return;
      }
      executeWorkflow(workflowId);
      done();
    });
    setInterval(() => {
      this.queue.clients.forEach((client) => {
        client.ping();
      });
    }, 10000);
  }
  async create(config: any) {
    console.log("Creating cron unique key here.", config);
    if (!config.id) {
      throw new Error("WorkflowId does not exist, cannot create cron");
    }
    const result = await this.queue.add(config, {
      repeat: { cron: config.cron, tz: config.tz },
      jobId: config.id,
    });
    console.log("JobId created, ", result.id);
    return config;
  }
  async read(id: string) {
    const jobs = await this.queue.getRepeatableJobs();
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].id === id) {
        console.log("Reading job with id", id);
        return jobs[i];
      }
    }
    return null;
  }
  async delete(id: string) {
    console.log("Deleting cron ", id);
    const jobs = await this.queue.getRepeatableJobs();
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].id === id) {
        console.log("deleting job with id", id, jobs[i].id);
        await this.queue.removeRepeatable({
          cron: jobs[i].cron,
          tz: jobs[i].tz,
          jobId: jobs[i].id,
        });
      }
    }
  }
  async update(config: any) {
    await this.delete(config.id);
    return await this.create(config);
  }

  async deleteByKey(key: string) {
    const jobs = await this.queue.getRepeatableJobs();
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].key === key) {
        console.log("deleting job with key", key, jobs[i].key);
        await this.queue.removeRepeatable({
          cron: jobs[i].cron,
          tz: jobs[i].tz,
          jobId: jobs[i].id,
        });
      }
    }
  }
}

export default new CronService();
